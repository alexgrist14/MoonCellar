"use client";

import { useEffect } from "react";
import { useGeoStore } from "../../store/geo.store";

export const GeoInit = () => {
  const setGeo = useGeoStore((s) => s.setGeo);

  useEffect(() => {
    let active = true;
    fetch("/api/geo")
      .then((r) => r.json())
      .then((geo) => {
        if (active) setGeo({ country: geo.country ?? null, blockedCountry: !!geo.blockedCountry });
      })
      .catch(() => {
        if (active) setGeo({ country: null, blockedCountry: false });
      });
    return () => {
      active = false;
    };
  }, [setGeo]);

  return null;
};
