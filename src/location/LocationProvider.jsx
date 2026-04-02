import { useEffect, useState } from "react";
import { LocationContext } from "./LocationContext";

export default function LocationProvider({ children }) {
  const [city, setCity] = useState(
    localStorage.getItem("selectedCity") || ""
  );

  useEffect(() => {
    if (city) {
      localStorage.setItem("selectedCity", city);
    }
  }, [city]);

  return (
    <LocationContext.Provider value={{ city, setCity }}>
      {children}
    </LocationContext.Provider>
  );
}