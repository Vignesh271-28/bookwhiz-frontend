import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from "@react-google-maps/api";
import { useState } from "react";

const containerStyle = {
  width: "100%",
  height: "400px",
};

export default function TheatreMap({ theatres, center }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const [selected, setSelected] = useState(null);

  if (!isLoaded) return <p>Loading map...</p>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={12}
    >
      {theatres.map(t => (
        <Marker
          key={t.id}
          position={{ lat: t.latitude, lng: t.longitude }}
          onClick={() => setSelected(t)}
        />
      ))}

      {selected && (
        <InfoWindow
          position={{ lat: selected.latitude, lng: selected.longitude }}
          onCloseClick={() => setSelected(null)}
        >
          <div>
            <h4>{selected.name}</h4>
            <p>{selected.area}</p>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}