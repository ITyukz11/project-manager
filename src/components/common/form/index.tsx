"use client";

import React from "react";
import { InputFormField } from "./input-form-field";
import { NumberFormField } from "./number-form-field";
import {
  SelectFormField,
  SelectOption,
} from "@/components/common/form/select-form-field";
import { MultiSelectFormField } from "@/components/common/form/multiple-select-form-field";
import { DateFormField } from "@/components/common/form/date-form-field";
import { SelectDataSource } from "@/components/ui/select-multiple-expandable";
import { TextareaFormField } from "@/components/common/form/textarea-form-field";
import { FileDropUploadFormField } from "@/components/common/form/file-drop-upload-form-field";
import { FileInputFormField } from "@/components/common/form/file-input-field";
import { MultiLevelItem } from "@/components/ui/select-multiple-level";
import { MultiLevelSelectFormField } from "@/components/common/form/multi-level-select-form-field";
import { SelectAddFormField } from "@/components/common/form/select-add-form-field";
import { CheckboxFormField } from "@/components/common/form/checkbox-form-field";
import { AmountFormField } from "./amount-form-field";

type FieldType =
  | "text"
  | "email"
  | "number"
  | "amount"
  | "select"
  | "multiselect"
  | "date"
  | "textarea"
  | "filedrop"
  | "file"
  | "multiplelevelselect"
  | "selectaddwithprops"
  | "checkbox";

type BaseProps = {
  type: FieldType;
  fieldName: string;
  label?: string;
  form: any;
  placeholder?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
};

type TextFieldProps = BaseProps & { type: "text"; inputClassName?: string };
type EmailFieldProps = BaseProps & { type: "email"; inputClassName?: string };

type NumberFieldProps = BaseProps & {
  type: "number";
  step?: number;
};

type AmountFieldProps = BaseProps & {
  type: "amount";
};

type SelectFieldProps = BaseProps & {
  type: "select";
  options: SelectOption[];
  isLoading?: boolean;
  allowClear?: boolean;
};

type MultiSelectFieldProps = BaseProps & {
  type: "multiselect";
  items: SelectDataSource | [];
  isLoading?: boolean;
  valueField?: string;
  labelField?: string;
  tooltipField?: string;
  maxShownItems?: number;
  fullWidth?: boolean;
};

type DateFieldProps = BaseProps & { type: "date" };

type TextareaFieldProps = BaseProps & {
  type: "textarea";
  description?: string;
  placeholder?: string;
  className?: string;
};

type FileUploadFieldProps = BaseProps & {
  type: "filedrop";
  title?: string;
  accept?: Record<string, string[]>;
  maxFiles?: number;
  maxSize?: number;
  onUpload?: (file: File) => Promise<void>;
};

type FileInputFieldProps = BaseProps & {
  type: "file";
  accept?: Record<string, string[]>;
  multiple?: boolean;
};

type MultipleLevelSelectFieldProps = BaseProps & {
  type: "multiplelevelselect";
  items: MultiLevelItem[];
  multiple?: boolean;
  width?: number;
  maxShownBadges?: number;
  selectClassName?: string;
  buttonClassName?: string;
};

type SelectAddFieldProps = BaseProps & {
  type: "selectaddwithprops";
  options: {
    value: string;
    label: string;
    children?: {
      value: string;
      label: string;
    }[];
  }[];
  multiple?: boolean;
  selectClassName?: string;
  buttonClassName?: string;
  addNewLabel?: string;
  onAddNew?: () => void;
};

type CheckboxFieldProps = BaseProps & {
  type: "checkbox";
};

//add new fieldProp here
type GlobalFormFieldProps =
  | TextFieldProps
  | NumberFieldProps
  | AmountFieldProps
  | SelectFieldProps
  | MultiSelectFieldProps
  | DateFieldProps
  | TextareaFieldProps
  | FileUploadFieldProps
  | FileInputFieldProps
  | MultipleLevelSelectFieldProps
  | SelectAddFieldProps
  | CheckboxFieldProps
  | EmailFieldProps;

const GlobalFormField: React.FC<GlobalFormFieldProps> = (props) => {
  const { type } = props;

  switch (type) {
    case "text":
      return <InputFormField {...props} type="text" />;
    case "email":
      return <InputFormField {...props} type="email" />;
    case "number":
      return <NumberFormField {...props} />;
    case "amount":
      return <AmountFormField {...props} />;
    case "select":
      return <SelectFormField {...props} />;
    case "multiselect":
      return <MultiSelectFormField {...props} />;
    case "date":
      return <DateFormField {...props} />;
    case "textarea":
      return <TextareaFormField {...props} />;
    case "filedrop":
      return <FileDropUploadFormField {...props} />;
    case "file":
      return <FileInputFormField {...props} />;
    case "multiplelevelselect":
      return <MultiLevelSelectFormField {...props} />;
    case "selectaddwithprops":
      return <SelectAddFormField {...props} />;
    case "checkbox":
      return <CheckboxFormField {...props} />;
    default:
      return null;
  }
};

export { GlobalFormField };
