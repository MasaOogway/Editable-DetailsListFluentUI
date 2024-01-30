// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import {
  Checkbox,
  DatePicker,
  DefaultButton,
  Dialog,
  DialogFooter,
  Dropdown,
  IComboBox,
  IComboBoxOption,
  IDropdownOption,
  IDropdownStyles,
  IStackTokens,
  ITag,
  ITextFieldStyles,
  Label,
  mergeStyleSets,
  PrimaryButton,
  Stack,
  TextField
} from '@fluentui/react';
import { DayPickerStrings } from '../editablegrid/datepickerconfig';
import {
  GetDefault,
  IsValidDataType,
  ParseType,
  SelectComponentStyles,
  SelectComponentTheme
} from '../editablegrid/helper';
import PickerControl from '../editablegrid/pickercontrol/picker';
import { IColumnConfig } from '../types/columnconfigtype';
import { EditControlType } from '../types/editcontroltype';
import { SyntheticEvent, useCallback, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { NumericFormat } from 'react-number-format';
import Select from 'react-select';

interface Props {
  columnConfigurationData: IColumnConfig[];
  onDialogCancel?: any;
  onDialogSave?: any;
}

const ColumnUpdateDialog = (props: Props) => {
  const controlClass = mergeStyleSets({
    inputClass: {
      display: 'block',
      width: '100%'
    },
    dialogClass: {
      padding: 20
    }
  });

  const textFieldStyles: Partial<ITextFieldStyles> = { fieldGroup: {} };

  const [gridColumn, setGridColumn] = useState('');
  const [inputValue, setInputValue] = useState<any>(null);

  const stackTokens: IStackTokens = { childrenGap: 10 };
  const dropdownStyles: Partial<IDropdownStyles> = {
    dropdown: { width: '100%' }
  };

  useEffect(() => {
    let tmpColumnValuesObj: any = {};
    props.columnConfigurationData
      .filter((x) => x.editable == true)
      .forEach((item, index) => {
        tmpColumnValuesObj[item.key] = {
          value: GetDefault(item.dataType),
          isChanged: false,
          error: null
        };
      });
    setInputValue(tmpColumnValuesObj);
  }, [props.columnConfigurationData]);

  const SetObjValues = (
    key: string,
    value: any,
    isChanged: boolean = true,
    errorMessage: string | null = null
  ): void => {
    var inputValueTmp: any = { ...inputValue };
    var objectKeys = Object.keys(inputValueTmp);
    objectKeys.forEach((objKey) => {
      inputValueTmp[objKey]['isChanged'] = false;
    });
    inputValueTmp[key] = {
      value: value,
      isChanged: isChanged,
      error: errorMessage
    };
    setInputValue(inputValueTmp);
  };

  const onTextUpdate = (
    ev: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    text: string,
    column: IColumnConfig
  ): void => {
    if (!IsValidDataType(column?.dataType, text)) {
      SetObjValues(
        (ev.target as Element).id,
        text,
        false,
        `Data should be of type '${column.dataType}'`
      );
      return;
    }

    SetObjValues((ev.target as Element).id, ParseType(column.dataType, text));
  };

  const [inputFieldContent, setInputFieldContent] = useState<JSX.Element | undefined>(<></>);

  const onSelectDate = (date: Date | null | undefined, item: any): void => {
    SetObjValues(item.key, date);
  };

  const onCellPickerTagListChanged = (cellPickerTagList: ITag[] | undefined, item: any): void => {
    if (cellPickerTagList && cellPickerTagList[0] && cellPickerTagList[0].name)
      SetObjValues(item.key, cellPickerTagList[0].name);
    else SetObjValues(item.key, '');
  };

  const onDropDownChange = (
    event: React.FormEvent<HTMLDivElement>,
    selectedDropdownItem: IDropdownOption | undefined,
    item: any
  ): void => {
    SetObjValues(item.key, selectedDropdownItem?.key);
  };

  const onNumericFormatUpdate = (
    ev: SyntheticEvent<HTMLInputElement, Event> | undefined,
    text: string,
    item: any
  ): void => {
    SetObjValues(item.key, text);
  };

  const onComboBoxChange = (
    event: React.FormEvent<IComboBox> | undefined,
    selectedOption: IComboBoxOption | undefined,
    item: any
  ): void => {
    SetObjValues(item.key, selectedOption?.key);
  };

  const onCheckBoxChange = (
    ev: React.FormEvent<HTMLElement | HTMLInputElement> | undefined,
    isChecked: boolean,
    item: any
  ): void => {
    SetObjValues(item.key, isChecked ?? false);
  };

  const onSelectGridColumn = (
    event: React.FormEvent<HTMLDivElement>,
    item: IDropdownOption | undefined
  ): void => {
    setGridColumn(item!.key.toString());
  };

  const closeDialog = useCallback((): void => {
    if (props.onDialogCancel) {
      props.onDialogCancel();
    }

    setInputFieldContent(undefined);
  }, []);

  const saveDialog = (): void => {
    if (props.onDialogSave) {
      var inputValueTmp: any = {};
      var objectKeys = Object.keys(inputValue);
      var BreakException = {};
      try {
        objectKeys.forEach((objKey) => {
          if (inputValue[objKey]['isChanged']) {
            inputValueTmp[objKey] = inputValue[objKey]['value'];
            throw BreakException;
          }
        });
      } catch (e) {
        // if (e !== BreakException) throw e;
      }

      props.onDialogSave(inputValueTmp);
    }

    setInputFieldContent(undefined);
  };

  const createDropDownOptions = (): IDropdownOption[] => {
    let dropdownOptions: IDropdownOption[] = [];
    props.columnConfigurationData.forEach((item, index) => {
      if (item.editable == true) {
        dropdownOptions.push({ key: item.key, text: item.text });
      }
    });

    return dropdownOptions;
  };

  const options = createDropDownOptions();
  const [comboOptions, setComboOptions] = useState<IComboBoxOption[]>([]);
  const [init, setInit] = useState<boolean>(false);

  const GetInputFieldContent = (): JSX.Element => {
    var column = props.columnConfigurationData.filter((x) => x.key == gridColumn);
    if (column.length > 0) {
      switch (column[0].inputType) {
        case EditControlType.Date:
          return (
            <DatePicker
              strings={DayPickerStrings}
              placeholder="Select a date..."
              ariaLabel="Select a date"
              className={controlClass.inputClass}
              onSelectDate={(date) => onSelectDate(date, column[0])}
              //value={new Date()}
            />
          );
        case EditControlType.Picker:
          return (
            <div>
              <PickerControl
                arialabel={column[0].text}
                selectedItemsLimit={1}
                pickerTags={column[0].pickerOptions?.pickerTags ?? []}
                minCharLimitForSuggestions={2}
                onTaglistChanged={(selectedItem: ITag[] | undefined) =>
                  onCellPickerTagListChanged(selectedItem, column[0])
                }
                pickerDescriptionOptions={column[0].pickerOptions?.pickerDescriptionOptions}
              />
            </div>
          );
        case EditControlType.CheckBox:
          return (
            <Checkbox
              label={column[0].text}
              onChange={(ev, isChecked) => {
                onCheckBoxChange(ev, isChecked ?? false, column[0]);
              }}
            />
          );
        case EditControlType.DropDown:
          return (
            <Dropdown
              label={column[0].text}
              options={
                column[0].filterDropdownOptions
                  ? column[0].filterDropdownOptions.filterOptions.filter(
                      (x) =>
                        x.correspondingKey ==
                        inputValue[
                          column[0].filterDropdownOptions?.filterBasedOnThisColumnKey ?? ''
                        ].value
                    )
                  : column[0].dropdownValues ?? []
              }
              onChange={(ev, selected) => onDropDownChange(ev, selected, column[0])}
            />
          );

        case EditControlType.ComboBox:
          return (
            <Select
              menuPlacement="auto"
              menuPosition="fixed"
              key={uuidv4()}
              aria-label={column[0].text}
              filterOption={
                column[0].comboBoxProps?.searchType == 'startswith'
                  ? (option, inputValue) =>
                      option.label?.toLowerCase()?.startsWith(inputValue?.toLowerCase())
                  : undefined
              }
              placeholder={column[0].comboBoxProps?.placeholder ?? 'Select Option'}
              tabSelectsValue={false}
              noOptionsMessage={
                column[0].comboBoxProps?.noOptionsFoundMessage
                  ? () => column[0].comboBoxProps?.noOptionsFoundMessage
                  : undefined
              }
              isClearable={true}
              backspaceRemovesValue
              escapeClearsValue
              openMenuOnFocus
              options={
                column[0].comboBoxOptions
                  ?.map((itm) => {
                    return { value: itm.key, label: itm.text };
                  })
                  ?.concat({ value: '', label: '' }) ?? []
              }
              value={column[0].comboBoxOptions
                ?.map((item) => {
                  return { value: item.key, label: item.text };
                })
                .find(
                  (x) =>
                    x.label == inputValue[column[0].key].value ||
                    x.value == inputValue[column[0].key].value
                )}
              hideSelectedOptions
              onChange={(options, av) => {
                const option = options as {
                  value: string | number;
                  label: string;
                };

                let convertOption: IComboBoxOption = { key: '', text: '' };

                if (options) convertOption = { key: option.value, text: option.label };

                onComboBoxChange(undefined, convertOption, column[0]);
              }}
              theme={SelectComponentTheme}
              styles={SelectComponentStyles}
            />
          );
        case EditControlType.MultilineTextField:
          return (
            <TextField
              errorMessage={inputValue[column[0].key].error}
              className={controlClass.inputClass}
              multiline={true}
              rows={1}
              placeholder={`Enter '${column[0].text}'...`}
              id={column[0].key}
              styles={textFieldStyles}
              onChange={(ev, text) => onTextUpdate(ev, text!, column[0])}
              value={inputValue[column[0].key].value || ''}
            />
          );
        case EditControlType.NumericFormat:
          return (
            <NumericFormat
              key={column[0].key}
              value={inputValue[column[0].key].value || ''}
              placeholder={column[0].validations?.numericFormatProps?.formatBase?.placeholder}
              valueIsNumericString={
                column[0].validations?.numericFormatProps?.formatBase?.valueIsNumericString
              }
              type={column[0].validations?.numericFormatProps?.formatBase?.type}
              inputMode={column[0].validations?.numericFormatProps?.formatBase?.inputMode}
              renderText={column[0].validations?.numericFormatProps?.formatBase?.renderText}
              label={column[0].validations?.numericFormatProps?.label ?? column[0].text}
              decimalScale={column[0].validations?.numericFormatProps?.formatProps?.decimalScale}
              fixedDecimalScale={
                column[0].validations?.numericFormatProps?.formatProps?.fixedDecimalScale
              }
              decimalSeparator={
                column[0].validations?.numericFormatProps?.formatProps?.decimalSeparator
              }
              allowedDecimalSeparators={
                column[0].validations?.numericFormatProps?.formatProps?.allowedDecimalSeparators
              }
              thousandsGroupStyle={
                column[0].validations?.numericFormatProps?.formatProps?.thousandsGroupStyle
              }
              thousandSeparator={
                column[0].validations?.numericFormatProps?.formatProps?.thousandSeparator
              }
              onRenderLabel={column[0].validations?.numericFormatProps?.onRenderLabel}
              ariaLabel={column[0].validations?.numericFormatProps?.ariaLabel ?? column[0].text}
              customInput={TextField}
              suffix={column[0].validations?.numericFormatProps?.formatProps?.suffix}
              prefix={column[0].validations?.numericFormatProps?.formatProps?.prefix}
              allowLeadingZeros={
                column[0].validations?.numericFormatProps?.formatProps?.allowLeadingZeros
              }
              allowNegative={column[0].validations?.numericFormatProps?.formatProps?.allowNegative}
              isAllowed={column[0].validations?.numericFormatProps?.formatBase?.isAllowed}
              onValueChange={(values, sourceInfo) =>
                onNumericFormatUpdate(
                  sourceInfo.event,
                  values.formattedValue ?? values.value,
                  column[0]
                )
              }
            />
          );
          break;
        default:
          return (
            <TextField
              errorMessage={inputValue[column[0].key].error}
              className={controlClass.inputClass}
              placeholder={`Enter '${column[0].text}'...`}
              onChange={(ev, text) => onTextUpdate(ev, text!, column[0])}
              styles={textFieldStyles}
              id={column[0].key}
              value={inputValue[column[0].key].value || ''}
            />
          );
      }
    }

    return <></>;
  };

  return (
    <Dialog hidden={!inputFieldContent} onDismiss={closeDialog} closeButtonAriaLabel="Close">
      <Stack grow verticalAlign="space-between" tokens={stackTokens}>
        <Stack.Item grow={1}>
          <Dropdown
            placeholder="Select the Column"
            options={options}
            styles={dropdownStyles}
            onChange={onSelectGridColumn}
          />
        </Stack.Item>
        <Stack.Item grow={1}>{GetInputFieldContent()}</Stack.Item>
        <Stack.Item>
          <DialogFooter className={controlClass.inputClass}>
            <PrimaryButton
              // eslint-disable-next-line react/jsx-no-bind
              onClick={saveDialog}
              text="Save"
              disabled={
                gridColumn
                  ? inputValue[gridColumn].error != null && inputValue[gridColumn].error.length > 0
                  : false
              }
            />
            <DefaultButton onClick={closeDialog} text="Cancel" />
          </DialogFooter>
        </Stack.Item>
      </Stack>
    </Dialog>
  );
};

export default ColumnUpdateDialog;
