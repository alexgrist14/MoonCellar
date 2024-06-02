import { GroupBase, StylesConfig } from "react-select";

export const API_URL = "http://77.222.42.88:3228";

export const apiNames: { [key: string]: string } = {
  RA: "RetroAchievements",
  IGDB: "IGDB",
};

export const selectStyles = <T>(
  type: "default" | "include" | "exclude"
): StylesConfig<
  {
    value: T;
    label: string;
    image?: string;
  },
  boolean,
  GroupBase<{
    value: T;
    label: string;
    image?: string;
  }>
> => {
  const getControlBorder = (isFocused?: boolean) => {
    if (type === "default") return isFocused ? "#777777" : "#555555";
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
    option: (baseStyles, { isFocused, data }) => ({
      ...baseStyles,
      ":active": { backgroundColor: "#222222" },
      ...(!!data.image && {
        "::before": {
          content: '""',
          width: "30px",
          height: "30px",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundImage: `url(${data.image})`,
        },
      }),
      display: "grid",
      gridTemplateColumns: !!data.image ? "5% 1fr" : "1fr",
      alignItems: "center",
      justifyContent: "center",
      gap: "10px",
      cursor: "pointer",
      backgroundColor: !isFocused ? "#333333" : "#555555",
    }),
    menuList: (baseStyles) => ({
      ...baseStyles,
      backgroundColor: "#333333",
      borderRadius: "5px",
    }),
    menu: (baseStyles) => ({
      ...baseStyles,
      backgroundColor: "#333333",
      border: `1px solid ${getControlBorder()}`,
      boxShadow: "0 0 10px 5px #222222",
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
