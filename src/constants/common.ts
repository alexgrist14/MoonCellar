import { GroupBase, StylesConfig } from "react-select";

export const apiNames: { [key: string]: string } = {
  RA: "RetroAchievements",
  IGDB: "IGDB",
};

export const selectStyles = (
  type: "default" | "include" | "exclude"
): StylesConfig<
  {
    value: any;
    label: string;
  },
  boolean,
  GroupBase<{
    value: any;
    label: string;
  }>
> => {
  const getControlBorder = (isFocused?: boolean) => {
    if (type === "default") return isFocused ? "#555555" : "#444444";
    if (type === "include") return isFocused ? "#aad998" : "#1CD998";
    if (type === "exclude") return isFocused ? "#a9534F" : "#D9534F";
  };

  return {
    control: (baseStyles) => ({
      ...baseStyles,
      ":hover": {
        borderColor: getControlBorder(true),
        boxShadow: "none",
      },
      borderColor: getControlBorder(),
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
};
