import { useState, useEffect } from "react";
import { searchCities } from "../api/locationApi";
import { useLocation } from "./useLocation";

export default function LocationSearch() {
  const { city, setCity } = useLocation();
  const [query, setQuery] = useState(city);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    searchCities(query).then(res => {
      setSuggestions(res.data);
    });
  }, [query]);

  return (
    <div className="relative w-64">
      
      {/* Input */}
      <input
        type="text"
        placeholder="Search city"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full px-4 py-2 rounded-md border border-gray-300
                   focus:outline-none focus:ring-2 focus:ring-red-500
                   placeholder-gray-400"
      />

      {/* Suggestions Dropdown */}
      {suggestions.length > 0 && (
        <div className="absolute z-50 mt-2 w-full bg-white rounded-md
                        shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
          {suggestions.map((c) => (
            <div
              key={c}
              onClick={() => {
                setCity(c);
                setQuery(c);
                setSuggestions([]);
              }}
              className="px-4 py-2 cursor-pointer text-sm text-gray-700
                         hover:bg-red-50 hover:text-red-600 transition"
            >
              {c}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}