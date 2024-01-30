self.onmessage = function (event) {
  const {
    changesHaveBeenMade,
    messages,
    defaultGridDataTmp,
    indentiferColumn,
    props,
    ignoredColProperties,
    MessageBarType,
    DepColTypes,
    _Operation
  } = event.data;

  let localError = false;
  const msgMap = new Map(messages);

  if (changesHaveBeenMade == false) {
    self.postMessage({ isError: localError, messages: msgMap });
    self.close();
    return;
  }

  const tmpInsertToMessageMap = (key, value) => {
    msgMap.set(key, value);
  };

  const findDuplicates = (array) => {
    const duplicates = [];
    const seen = {};

    return new Promise((resolve) => {
      const makeEverythingAString = array.map((obj) => {
        const convertedObj = {};
        for (const key in obj) {
          if (obj[key] == null || obj[key] == undefined) convertedObj[key] = '';
          else {
            convertedObj[key] = String(obj[key]).toLowerCase();
          }
        }
        return convertedObj;
      });
      const ignoredProperties = [...ignoredColProperties];

      if (indentiferColumn !== null && indentiferColumn !== undefined) {
        ignoredProperties.push(indentiferColumn);
      }

      if (props.customOperationsKey) {
        ignoredProperties.push(props.customOperationsKey.colKey);
      }

      if (props.ignoreTheseKeysWhenDeterminingDuplicatedRows) {
        for (
          let index = 0;
          index < props.ignoreTheseKeysWhenDeterminingDuplicatedRows.length;
          index++
        ) {
          const key = props.ignoreTheseKeysWhenDeterminingDuplicatedRows[index];
          ignoredProperties.push(key);
        }
      }

      if (props.customKeysToAddOnNewRow) {
        for (let index = 0; index < props.customKeysToAddOnNewRow.length; index++) {
          const element = props.customKeysToAddOnNewRow[index];
          if ((element.useKeyWhenDeterminingDuplicatedRows ?? false) == true)
            ignoredProperties.push(element.key);
        }
      }

      let key = '';

      makeEverythingAString.forEach((row, index) => {
        if (defaultGridDataTmp?.[0]) {
          key = JSON.stringify(
            Object.entries(row)
              .filter(([prop]) => Object.keys(defaultGridDataTmp[0]).includes(prop))
              .filter(([prop]) => props.columns.map((obj) => obj.key).includes(prop))
              .filter(([prop]) => !ignoredProperties.includes(prop))
              .sort()
          );

          if (seen[key]) {
            // Duplicate row found
            indentiferColumn !== null && indentiferColumn !== undefined
              ? seen[key].ids.push(row[indentiferColumn])
              : seen[key].ids.push(index);
          } else {
            if (indentiferColumn !== null && indentiferColumn !== undefined) {
              seen[key] = {
                index: duplicates.length,
                ids: [row[indentiferColumn]]
              };
              duplicates.push(seen[key].ids);
            } else {
              seen[key] = { index: duplicates.length, ids: [index] };
              duplicates.push(seen[key].ids);
            }
          }
        }
      });

      const resultsDups = duplicates
        .filter((ids) => ids.length > 1)
        .map((ids) => ids.sort((a, b) => a - b));
      if (resultsDups.length > 0) {
        resultsDups.forEach((dups, index) => {
          var msgDups =
            indentiferColumn !== null && indentiferColumn !== undefined
              ? `Rows Located At IDs: ${dups} are duplicated`
              : `Rows Located At Indexes ${dups} are duplicated`;

          tmpInsertToMessageMap('dups' + index, {
            msg: msgDups,
            type: MessageBarType.error
          });
        });

        localError = true;
      }
      resolve();
    });
  };

  const allValidationsIterations = () => {
    return new Promise((resolve) => {
      for (
        let row = 0;
        row <
        defaultGridDataTmp?.filter((x) => {
          if (props.customOperationsKey) {
            return (
              x._grid_row_operation_ != _Operation.None &&
              x._grid_row_operation_ != props.customOperationsKey.options.None
            );
          } else {
            return x._grid_row_operation_ != _Operation.None;
          }
        }).length;
        row++
      ) {
        const gridData = defaultGridDataTmp[row];
        var elementColNames = Object.keys(gridData);
        let emptyCol = [];
        let emptyReqCol = [];
        for (let indexInner = 0; indexInner < elementColNames.length; indexInner++) {
          const colNames = elementColNames[indexInner];
          const rowCol = gridData[colNames];
          const currentCol = props.columns.filter((x) => x.key === colNames);

          // ValidDataTypeCheck
          for (let j = 0; j < currentCol.length; j++) {
            const element = currentCol[j];
            const rowCol = gridData[element.key];

            if (
              element.required &&
              typeof element.required == 'boolean' &&
              (rowCol == null ||
                rowCol == undefined ||
                rowCol?.toString().length <= 0 ||
                (rowCol == '' && element.dataType != 'number'))
            ) {
              if (!emptyCol.includes(' ' + element.name)) emptyCol.push(' ' + element.name);
            } else if (
              typeof element.required !== 'boolean' &&
              !element.required.requiredOnlyIfTheseColumnsAreEmpty &&
              element.required.errorMessage &&
              (rowCol == null ||
                rowCol == undefined ||
                rowCol?.toString().length <= 0 ||
                (rowCol == '' && element.dataType != 'number'))
            ) {
              var msgEc =
                `Row ${
                  indentiferColumn
                    ? 'With ID: ' + gridData[indentiferColumn]
                    : 'With Index:' + row + 1
                } - ` + `${element.required.errorMessage}'.`;
              tmpInsertToMessageMap(element.key + row + 'empty', {
                msg: msgEc,
                type: MessageBarType.error
              });
            } else if (
              typeof element.required !== 'boolean' &&
              element.required.requiredOnlyIfTheseColumnsAreEmpty &&
              (rowCol == null ||
                rowCol == undefined ||
                rowCol?.toString().length <= 0 ||
                (rowCol == '' && element.dataType != 'number'))
            ) {
              const checkKeys = element.required.requiredOnlyIfTheseColumnsAreEmpty.colKeys;
              let skippable = false;
              for (let index = 0; index < checkKeys.length; index++) {
                const columnKey = checkKeys[index];
                const str = gridData[columnKey];

                if (element.required.alwaysRequired) {
                  if (
                    str == null ||
                    str == undefined ||
                    str?.toString().length <= 0 ||
                    (str == '' && element.dataType != 'number')
                  ) {
                    if (element.required.errorMessage) {
                      var msg1 =
                        `Row ${
                          indentiferColumn
                            ? 'With ID: ' + gridData[indentiferColumn]
                            : 'With Index:' + row + 1
                        } - ` + `${element.required.errorMessage}'.`;
                      tmpInsertToMessageMap(element.key + row + 'empty', {
                        msg: msg1,
                        type: MessageBarType.error
                      });
                    } else if (!emptyReqCol.includes(' ' + element.name)) {
                      emptyReqCol.push(' ' + element.name);
                      break;
                    }
                  }
                } else {
                  if ((str || str?.toString()?.trim() == '0') && str?.toString().length > 0) {
                    skippable = true;
                    break;
                  }
                }
              }
              if (!emptyReqCol.includes(' ' + element.name) && skippable == false) {
                if (!element.required.errorMessage) emptyReqCol.push(' ' + element.name);
                else {
                  var msg2 =
                    `Row ${
                      indentiferColumn
                        ? 'With ID: ' + gridData[indentiferColumn]
                        : 'With Index:' + row + 1
                    } - ` + `${element.required.errorMessage}'.`;
                  tmpInsertToMessageMap(element.key + row + 'empty', {
                    msg: msg2,
                    type: MessageBarType.error
                  });
                }
              }
            }

            if (
              rowCol !== null &&
              (typeof rowCol !== element.dataType || typeof rowCol === 'number')
            ) {
              if (element.dataType === 'number') {
                if (rowCol && isNaN(parseInt(rowCol)) && rowCol !== '') {
                  var msg3 =
                    `Row ${
                      indentiferColumn
                        ? 'With ID: ' + gridData[indentiferColumn]
                        : 'With Index:' + row + 1
                    } Col: ${element.name} - ` + `Value is not a '${element.dataType}'.`;
                  tmpInsertToMessageMap(element.key + row, {
                    msg: msg3,
                    type: MessageBarType.error
                  });

                  localError = true;
                } else if (
                  element.validations &&
                  element.validations.numberBoundaries &&
                  element.validations.numberBoundaries.validateOnPastingOnly == false
                ) {
                  const min = element.validations.numberBoundaries.minRange;
                  const max = element.validations.numberBoundaries.maxRange;

                  if (min && max) {
                    if (!(min <= parseInt(rowCol) && max >= parseInt(rowCol))) {
                      var msg4 =
                        `Row ${
                          indentiferColumn
                            ? 'With ID: ' + gridData[indentiferColumn]
                            : 'With Index:' + row + 1
                        } Col: ${element.name} - ` +
                        `Value outside of range '${min} - ${max}'. Entered value ${rowCol}`;
                      tmpInsertToMessageMap(element.key + row, {
                        msg: msg4,
                        type: MessageBarType.error
                      });

                      localError = true;
                    }
                  } else if (min) {
                    if (!(min <= parseInt(rowCol))) {
                      var msg5 =
                        `Row ${
                          indentiferColumn
                            ? 'With ID: ' + gridData[indentiferColumn]
                            : 'With Index:' + row + 1
                        } Col: ${element.name} - ` +
                        `Value is lower than required range: '${min}'. Entered value ${rowCol}`;
                      tmpInsertToMessageMap(element.key + row, {
                        msg: msg5,
                        type: MessageBarType.error
                      });

                      localError = true;
                    }
                  } else if (max) {
                    if (!(max >= parseInt(rowCol))) {
                      var msg6 =
                        `Row ${
                          indentiferColumn
                            ? 'With ID: ' + gridData[indentiferColumn]
                            : 'With Index:' + row + 1
                        } Col: ${element.name} - ` +
                        `Value is greater than required range: '${max}'. Entered value ${rowCol}`;
                      tmpInsertToMessageMap(element.key + row, {
                        msg: msg6,
                        type: MessageBarType.error
                      });

                      localError = true;
                    }
                  }
                }
              } else if (element.dataType === 'boolean') {
                try {
                  Boolean(rowCol);
                } catch (error) {
                  var msg7 =
                    `Row ${
                      indentiferColumn
                        ? 'With ID: ' + gridData[indentiferColumn]
                        : 'With Index:' + row + 1
                    } Col: ${element.name} - ` + `Value is not a '${element.dataType}'.`;
                  tmpInsertToMessageMap(element.key + row, {
                    msg: msg7,
                    type: MessageBarType.error
                  });

                  localError = true;
                }
              } else if (element.dataType === 'date') {
                try {
                  const isValidDate = (value) => {
                    const date = new Date(value);
                    return !isNaN(date);
                  };

                  if (!isValidDate(rowCol)) {
                    throw {};
                  } else {
                    continue;
                  }
                } catch (error) {
                  var msg8 =
                    `Row ${
                      indentiferColumn
                        ? 'With ID: ' + gridData[indentiferColumn]
                        : 'With Index:' + row + 1
                    } Col: ${element.name} - ` + `Value is not a '${element.dataType}'.`;
                  tmpInsertToMessageMap(element.key + row, {
                    msg: msg8,
                    type: MessageBarType.error
                  });

                  localError = true;
                }
              }
            }

            if (element.validations && element.validations.columnDependent) {
              for (let index = 0; index < element.validations.columnDependent.length; index++) {
                const colDep = element.validations.columnDependent[index];

                if (
                  gridData[colDep.dependentColumnKey] ||
                  gridData[colDep.dependentColumnKey] !== undefined
                ) {
                  const str = gridData[colDep.dependentColumnKey];
                  let skip = false;

                  if (
                    colDep.skipCheckIfTheseColumnsHaveData &&
                    colDep.skipCheckIfTheseColumnsHaveData.colKeys
                  ) {
                    for (const skipForKey of colDep.skipCheckIfTheseColumnsHaveData.colKeys) {
                      if (colDep.skipCheckIfTheseColumnsHaveData?.partial) {
                        const str = gridData[skipForKey];
                        if (
                          str &&
                          str !== null &&
                          str !== undefined &&
                          str?.toString().length > 0
                        ) {
                          skip = true;
                          break;
                        }
                      } else {
                        const str = gridData[skipForKey];
                        if (
                          str &&
                          str !== null &&
                          str !== undefined &&
                          str?.toString().length > 0
                        ) {
                          skip = true;
                        } else {
                          skip = false;
                          break;
                        }
                      }
                    }
                  }

                  if (!skip) {
                    if (str !== undefined && str !== null) {
                      if (str?.toString().length > 0 && colDep.type === DepColTypes.MustBeEmpty) {
                        if (rowCol !== null && rowCol?.toString().length > 0) {
                          var msg9 =
                            `Row ${
                              indentiferColumn
                                ? 'With ID: ' + gridData[indentiferColumn]
                                : 'With Index:' + row + 1
                            } - ` +
                            (colDep.errorMessage ??
                              `Data cannot be entered in ${element.name} and in ${colDep.dependentColumnName} Column. Remove data in ${colDep.dependentColumnName} Column to enter data here.`);

                          tmpInsertToMessageMap(row + 'ColDep', {
                            msg: msg9,
                            type: MessageBarType.error
                          });

                          localError = true;
                        }
                      }
                    }
                    if (
                      (str == undefined ||
                        str == null ||
                        (str == '' && element.dataType != 'number') ||
                        (str && str?.toString().length <= 0)) &&
                      colDep.type === DepColTypes.MustHaveData
                    ) {
                      var msg10 =
                        `Row ${
                          indentiferColumn
                            ? 'With ID: ' + gridData[indentiferColumn]
                            : 'With Index:' + row + 1
                        } - ` +
                        (colDep.errorMessage ??
                          ` Data needs to entered in ${colDep.dependentColumnName} and in ${element.name} Column.`);

                      tmpInsertToMessageMap(row + 'ColDep', {
                        msg: msg10,
                        type: MessageBarType.error
                      });
                      localError = true;
                    }
                  }
                }
              }
            }

            if (element.validations && element.validations.regexValidation) {
              for (let index = 0; index < element.validations.regexValidation.length; index++) {
                const data = element.validations.regexValidation[index];
                if (!data.regex.test(rowCol)) {
                  var msg11 =
                    `Row ${
                      indentiferColumn
                        ? 'With ID: ' + gridData[indentiferColumn]
                        : 'With Index:' + row + 1
                    } - ` + `${data.errorMessage}`;
                  tmpInsertToMessageMap(element.key + row, {
                    msg: msg11,
                    type: MessageBarType.error
                  });

                  localError = true;
                }
              }
            }

            if (element.validations && element.validations.stringValidations) {
              const caseInsensitive = element.validations.stringValidations.caseInsensitive;
              if (caseInsensitive) {
                if (
                  rowCol !== null &&
                  element.validations.stringValidations?.conditionCantEqual?.toLowerCase() ===
                    rowCol?.toString().toLowerCase()
                ) {
                  var msg12 =
                    `Row ${
                      indentiferColumn
                        ? 'With ID: ' + gridData[indentiferColumn]
                        : 'With Index:' + row + 1
                    } - ` + `${element.validations.stringValidations?.errMsg}`;
                  tmpInsertToMessageMap(element.key + row, {
                    msg: msg12,
                    type: MessageBarType.error
                  });

                  localError = true;
                } else {
                  if (
                    rowCol !== null &&
                    element.validations.stringValidations?.conditionCantEqual === rowCol?.toString()
                  ) {
                    var msg13 =
                      `Row ${
                        indentiferColumn
                          ? 'With ID: ' + gridData[indentiferColumn]
                          : 'With Index:' + row + 1
                      } - ` + `${element.validations.stringValidations?.errMsg}`;
                    tmpInsertToMessageMap(element.key + row, {
                      msg: msg13,
                      type: MessageBarType.error
                    });

                    localError = true;
                  }
                }
              }
            }
          }
        }

        if (emptyReqCol.length > 1) {
          var msg14 = `Row ${
            indentiferColumn ? 'With ID: ' + gridData[indentiferColumn] : 'With Index:' + row + 1
          } - ${emptyReqCol} cannot all be empty`;

          tmpInsertToMessageMap(row + 'erc', {
            msg: msg14,
            type: MessageBarType.error
          });

          localError = true;
        } else if (emptyReqCol.length == 1) {
          var msg15 = `Row: ${
            indentiferColumn ? 'With ID: ' + gridData[indentiferColumn] : row + 1
          } - ${emptyReqCol} cannot be empty`;

          tmpInsertToMessageMap(row + 'erc', {
            msg: msg15,
            type: MessageBarType.error
          });

          localError = true;
        }

        if (emptyCol.length > 1) {
          var msg16 = `Row ${
            indentiferColumn ? 'With ID: ' + gridData[indentiferColumn] : 'With Index: ' + row + 1
          } - ${emptyCol?.toString()} cannot be empty at all`;

          tmpInsertToMessageMap(row + 'ec', {
            msg: msg16,
            type: MessageBarType.error
          });

          localError = true;
        } else if (emptyCol.length == 1) {
          var msg17 = `Row ${
            indentiferColumn ? 'With ID: ' + gridData[indentiferColumn] : 'With Index: ' + row + 1
          } - ${emptyCol?.toString()} cannot be empty`;

          tmpInsertToMessageMap(row + 'ec', {
            msg: msg17,
            type: MessageBarType.error
          });

          localError = true;
        }
      }

      resolve();
    });
  };

  const terminateWorker = (data) => {
    self.postMessage(data);
    self.close();
  };

  Promise.all([
    /*Duplicate Rows Check ->*/ findDuplicates(defaultGridDataTmp),
    allValidationsIterations()
  ]).then(() => {
    terminateWorker({ isError: localError, messages: msgMap });
  });
};
