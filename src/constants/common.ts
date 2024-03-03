import { GroupBase, StylesConfig } from "react-select";

export const apiNames: { [key: string]: string } = {
  RA: "RetroAchievements",
  IGDB: "IGDB",
};

export const singleSelectStyles: StylesConfig<
  {
    value: any;
    label: string;
  },
  boolean,
  GroupBase<{
    value: any;
    label: string;
  }>
> = {
  control: (baseStyles, { isFocused }) => ({
    ...baseStyles,
    ":hover": { borderColor: "#555555", boxShadow: "none" },
    borderColor: isFocused ? "#222222" : "#444444",
    boxShadow: "none",
    backgroundColor: "#333333",
    color: "white",
    cursor: "pointer",
  }),
  dropdownIndicator: (baseStyles) => ({
    ...baseStyles,
    ":hover": { color: "#777777" },
    color: "#555555",
  }),
  indicatorSeparator: (baseStyles) => ({
    ...baseStyles,
    backgroundColor: "#555555",
  }),
  multiValueRemove: (baseStyles) => ({
    ...baseStyles,
    color: "#777777",
  }),
  option: (baseStyles, { isFocused }) => ({
    ...baseStyles,
    ":active": { backgroundColor: "#222222" },
    cursor: "pointer",
    backgroundColor: isFocused ? "#222222" : "#333333",
  }),
  menuList: (baseStyles) => ({
    ...baseStyles,
    maxHeight: "250px",
    backgroundColor: "#333333",
  }),
  singleValue: (baseStyles) => ({
    ...baseStyles,
    textAlign: "start",
    color: "white",
  }),
  placeholder: (baseStyles) => ({
    ...baseStyles,
    textAlign: "start",
    color: "white",
  }),
  input: (baseStyles) => ({
    ...baseStyles,
    textAlign: "start",
    color: "white",
  }),
};

export const multiSelectStyles: StylesConfig<
  {
    value: any;
    label: string;
  },
  boolean,
  GroupBase<{
    value: any;
    label: string;
  }>
> = { ...singleSelectStyles };
