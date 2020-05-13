/**
 * @author Mounica Naidu M
 * Created 30 Aug 18
 * GitHub repo - 
 */

/**
 * Dependencies
 * Jquery
 * Treetable plugin - SlickGrid 2.3.16
 */

/**
 * @constructor
 * @param {String} domElementSelector - Document Element id where the slickGrid is created
 */
var ManyamSlickGrid = function (domElementSelector) {
    this.DOMElementSelector = domElementSelector;
    this.data;
    this.rowGroups;
    this.columnKeys;
    this.columnGroups;
    this.aggregations;
}

/* Static Functions */

/**
 * Displays error logs
 * @param {Exception} e - Exception caught
 */
ManyamSlickGrid.logMessage = function (e) {
    console.info(e);
}

/**
 * Uses D3 functions for aggregations
 * Add more aggregations here
 */
ManyamSlickGrid.aggregationFn = {
    count: function (v) {
        return v.length;
    },
    sum: function (v, key) {
        return d3.sum(v, function (d) {
            return d[key];
        });
    },
    mean: function (v, key) {
        return d3.mean(v, function (d) {
            return d[key];
        });
    },
    min: function (v, key) {
        return d3.min(v, function (d) {
            return d[key];
        });
    },
    max: function (v, key) {
        return d3.max(v, function (d) {
            return d[key];
        });
    }
}

/**
 * Function to create a header row (same as slickGrid)
 */
function CreateAddlHeaderRow(grid, columns) {
    var $preHeaderPanel = $(grid.getPreHeaderPanel())
        .empty()
        .addClass("slick-header-columns")
        .css('left', '-1000px')
        .width(grid.getHeadersWidth());
    $preHeaderPanel.parent().addClass("slick-header");
    var headerColumnWidthDiff = grid.getHeaderColumnWidthDiff();
    var m, header, lastColumnGroup = '',
        widthTotal = 0;

    for (var i = 0; i < columns.length; i++) {
        m = columns[i];
        if (lastColumnGroup === m.columnGroup && i > 0) {
            widthTotal += m.width;
            header.width(widthTotal - headerColumnWidthDiff)
        } else {
            widthTotal = m.width;
            header = $("<div class='ui-state-default slick-header-column' />")
                .html("<span class='slick-column-name'>" + (m.columnGroup || '') + "</span>")
                .width(m.width - headerColumnWidthDiff)
                .appendTo($preHeaderPanel);
        }
        lastColumnGroup = m.columnGroup;
    }
}

/* Prototypes */

/**
 * Prepares column object for slickGrid
 */
ManyamSlickGrid.prototype.prepareColumnObject = function (parameterColFormatter) {
    try {
        let columnKeys = this.columnKeys;
        let columnGroups = this.columnGroups;
        let rowGroups = this.rowGroups;

        let colObjects = [];

        if (rowGroups) {
            let colObject = {
                id: 'Parameter',
                name: 'Parameter',
                field: 'Parameter',
                width: 500,
                minWidth: 120,
                cssClass: "cell-title",
                formatter: parameterColFormatter,
                editor: Slick.Editors.Text
            };
            colObjects.push(colObject);
        }

        if (columnKeys && !columnGroups) {
            columnKeys.forEach(element => {
                let colObject = {
                    id: element,
                    name: element,
                    field: element
                };
                colObjects.push(colObject);
            });
        }

        if (columnGroups) {
            let colGroupKeys = Object.keys(columnGroups);
            colGroupKeys.forEach(colGroupkey => {
                let colGroupCols = columnGroups[colGroupkey];
                colGroupCols.forEach(colGroupCol => {
                    let colObject = {
                        id: colGroupCol,
                        name: colGroupCol,
                        field: colGroupCol,
                        columnGroup: colGroupkey,
                        width: 200,
                        minWidth: 120

                    };
                    colObjects.push(colObject);
                });
            });
        }
        return colObjects;
    } catch (e) {
        ManyamSlickGrid.logMessage(e);
    }
}
var _data = [];

function walk(o, f, context) {
    f(o, context);
    if (typeof o !== 'object') return context;
    if (Array.isArray(o)) return o.forEach(e => walk(e, f, context)), context;
    for (let prop in o) walk(o[prop], f, context);
    return context;
}

/**
 * Prepares data required as input for SlickGrid
 * Default aggregation used if row grouping is present is 'count'
 */
ManyamSlickGrid.prototype.prepareData = function () {
    try {
        var rowGroups = this.rowGroups;
        var columnKeys = this.columnKeys;
        var aggregations = this.aggregations;
        var data = this.data;

        var _index = 0;

        var prepareSlickGridData = function (collection) {
            if (typeof (collection) === 'object') {
                var collectionKeys = Object.keys(collection);
                if (collectionKeys && collectionKeys.length > 0) {
                    for (let index = 0; index < collectionKeys.length; index++) {
                        const colKey = collectionKeys[index];
                        let childKeys = Object.keys(collection[colKey]);
                        if (childKeys && childKeys.length > 0) {
                            if (typeof (collection[colKey][childKeys[0]]) === 'object') {
                                let aggregatedData = walk(collection[colKey], (x, context) => {
                                    if (x !== undefined) {
                                        let _obj = {};
                                        columnKeys.forEach(function (colKey) {
                                            if (x[colKey]) {
                                                _obj[colKey] = x[colKey];
                                            }
                                        });
                                        if (Object.keys(_obj).length > 0) {
                                            context.push(_obj);
                                        }
                                    }
                                }, []);
                                let _obj = {};
                                _obj['id'] = _index;
                                _obj['indent'] = 0;
                                rowGroups.forEach(function (rowGroup, index) {
                                    if (colKey.substring(0, rowGroup.length) === rowGroup) {
                                        _obj['indent'] = index;
                                    }
                                });
                                _obj['parent'] = null;
                                _obj['Parameter'] = colKey;
                                columnKeys.forEach(function (columnKey) {
                                    let aggregationType = aggregations[columnKey] ? aggregations[columnKey] : "count";
                                    let aggregationFn = ManyamSlickGrid.aggregationFn[aggregationType];
                                    let aggregatedValue = aggregationFn(aggregatedData, columnKey);
                                    _obj[columnKey] = aggregatedValue ? aggregatedValue : null;
                                });
                                _index += 1;
                                _data.push(_obj);

                                prepareSlickGridData(collection[colKey], colKey);
                            } else {
                                let collectionKeys = Object.keys(collection);
                                collectionKeys.forEach(function (collectionKey) {
                                    let _obj = {};
                                    columnKeys.forEach(function (columnKey) {
                                        let colVal = collection[collectionKey][columnKey];
                                        _obj[columnKey] = colVal ? colVal : null;
                                    });
                                    _obj['id'] = _index;
                                    _obj['indent'] = 0;
                                    rowGroups.forEach(function (rowGroup, index) {
                                        if (collectionKey.substring(0, rowGroup.length) === rowGroup) {
                                            _obj['indent'] = index;
                                        }
                                    })
                                    _obj['parent'] = null;
                                    _obj['Parameter'] = collectionKey;
                                    _index += 1;
                                    _data.push(_obj);
                                });
                                break;
                            }
                        }
                    }
                }
            }
        }

        var nestFn = d3.nest();
        rowGroups.forEach(function (rowGroup) {
            nestFn.key(function (d) {
                return rowGroup + "-" + d[rowGroup];
            });
        });
        nestFn.rollup(function (v) {
            let returnObj = {};
            columnKeys.forEach(function (columnKey) {
                let aggregationType = aggregations[columnKey] ? aggregations[columnKey] : "count";
                let aggregationFn = ManyamSlickGrid.aggregationFn[aggregationType];
                returnObj[columnKey] = aggregationFn(v, columnKey);
            });
            return returnObj;
        });
        var nestedDataObj = nestFn.object(data);
        prepareSlickGridData(nestedDataObj);
        var assignParent = function (data) {
            var currentParentIndex = null;
            var previousParent = '';
            var parentIndex = [];
            for (let index = 0; index < data.length; index++) {
                const element = data[index]['Parameter'];
                for (let j = 0; j < rowGroups.length; j++) {
                    const rowGroup = rowGroups[j];
                    if (element.substring(0, rowGroup.length) === rowGroup) {
                        if (j === 0) { // for all first parent, parent = null
                            parentIndex = [];
                            data[index]['parent'] = null;
                            parentIndex[j] = index;
                        } else {
                            parentIndex[j] = index;
                            data[index]['parent'] = parentIndex[j - 1];
                        }
                    }
                }
                previousParent = element;
            }
            return data;
        }
        _data = assignParent(_data);
        return _data;
    } catch (e) {
        ManyamSlickGrid.logMessage(e);
    }
}

/**
 * 
 * @param {JSON} params
 * @param {JSON} params.data - Data object
 * @param {Array} params.rowGroups - Row keys for tree view. Order implies tree heirarchy
 * @param {Array} params.columnKeys - Keys of values to be displayed per row
 * @param {JSON} params.columnGroups - Header row to group columns
 * @param {Array} params.aggregations - Per column provide aggregations - example: sum, min, max, avg, std
 * 
 */
ManyamSlickGrid.prototype.init = function (params) {
    try {
        this.data = params.data;
        this.rowGroups = params.rowGroups;
        this.columnKeys = params.columnKeys;
        this.columnGroups = params.columnGroups;
        this.aggregations = params.aggregations;

        let columnGroups = this.columnGroups;

        /* Get column keys from columnGroups if not already available */
        if (columnGroups && !this.columnKeys) {
            let columnKeys = [];
            let colGroupKeys = Object.keys(columnGroups);
            colGroupKeys.forEach(colGroupkey => {
                let colGroupCols = columnGroups[colGroupkey];
                columnKeys = columnKeys.concat(colGroupCols);
            });

            this.columnKeys = columnKeys;
        }
    } catch (e) {
        ManyamSlickGrid.logMessage(e);
    }
}

/**
 * 
 */
ManyamSlickGrid.prototype.plot = function () {
    try {
        var parameterColFormatter = function (row, cell, value, columnDef, dataContext) {
            if (value == null || value == undefined || dataContext === undefined) {
                return "";
            }

            value = value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            var spacer = "<span style='display:inline-block;height:1px;width:" + (15 * dataContext["indent"]) +
                "px'></span>";
            var idx = dataView.getIdxById(dataContext.id);
            if (data[idx + 1] && data[idx + 1].indent > data[idx].indent) {
                if (dataContext._collapsed) {
                    return spacer + " <span class='toggle expand'></span>&nbsp;" + value;
                } else {
                    return spacer + " <span class='toggle collapse'></span>&nbsp;" + value;
                }
            } else {
                return spacer + " <span class='toggle'></span>&nbsp;" + value;
            }
        };

        var data = this.data;
        var rowGroups = this.rowGroups;
        if (rowGroups) {
            data = this.prepareData();
        }
        var container = this.DOMElementSelector;

        var dataView;
        var options = {
            enableCellNavigation: true,
            enableColumnReorder: false,
            createPreHeaderPanel: true,
            showPreHeaderPanel: true,
            preHeaderPanelHeight: 23,
            explicitInitialization: true,
            asyncEditorLoading: false
        };

        this.columns = this.prepareColumnObject(parameterColFormatter);
        var columns = this.columns;

        function myFilter(item) {
            let percentCompleteThreshold = 0;
            let searchString = '';
            if (item.parent != null) {
                var parent = data[item.parent];
                while (parent) {
                    if (parent._collapsed || (parent["percentComplete"] < percentCompleteThreshold) || (searchString != "" &&
                            parent["title"].indexOf(searchString) == -1)) {
                        return false;
                    }
                    parent = data[parent.parent];
                }
            }
            return true;
        }

        $(function () {
            dataView = new Slick.Data.DataView();
            grid = new Slick.Grid(container, dataView, columns, options);

            dataView.onRowCountChanged.subscribe(function (e, args) {
                grid.updateRowCount();
                grid.render();
            });
            dataView.onRowsChanged.subscribe(function (e, args) {
                grid.invalidateRows(args.rows);
                grid.render();
            });
            grid.init();
            grid.onColumnsResized.subscribe(function (e, args) {
                CreateAddlHeaderRow(grid, columns);
            });
            grid.onCellChange.subscribe(function (e, args) {
                dataView.updateItem(args.item.id, args.item);
            });
            grid.onClick.subscribe(function (e, args) {
                if ($(e.target).hasClass("toggle")) {
                    var item = dataView.getItem(args.row);
                    if (item) {
                        if (!item._collapsed) {
                            item._collapsed = true;
                        } else {
                            item._collapsed = false;
                        }
                        dataView.updateItem(item.id, item);
                    }
                    e.stopImmediatePropagation();
                }
            });
            CreateAddlHeaderRow(grid, columns);

            dataView.beginUpdate();
            dataView.setItems(data);
            dataView.setFilter(myFilter);
            dataView.endUpdate();
        });
    } catch (e) {
        ManyamSlickGrid.logMessage(e);
    }
}

/**
 * 
 * @param {JSON} params 
 */
ManyamSlickGrid.prototype.generateTreeTable = function (params) {
    try {
        this.init(params);
        this.plot();
    } catch (e) {
        ManyamSlickGrid.logMessage(e);
    }

    return this;
}