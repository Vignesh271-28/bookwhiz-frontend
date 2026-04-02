import { useEffect, useState } from "react";
import { fetchShows } from "../../api/showApi";
import { useLocation } from "../../location/useLocation";
import { useNavigate } from "react-router-dom";

export default function ShowTimings({ movieId }) {
  const { city } = useLocation();
  const [shows, setShows] = useState([]);
  const navigate = useNavigate();


  useEffect(() => {
    if (!city || !movieId) return;

    fetchShows(movieId, city).then(res => setShows(res.data));

    console.log("movieId:", movieId, "city:", city);
  }, [movieId, city]);

  // Group by theatre
  const grouped = shows.reduce((acc, s) => {
    const name = s.venue.name;
    acc[name] = acc[name] || [];
    acc[name].push(s);
    return acc;
  }, {});


  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      
      {/* Heading */}
      <h3 className="text-xl font-bold text-gray-800 mb-6">
         Show Timings in <span className="text-red-500">{city}</span>
      </h3>

      {/* Theatre List */}
      {Object.keys(grouped).map(theatre => (
        <div
          key={theatre}
          className="bg-white rounded-xl shadow-md p-5 mb-6"
        >
          {/* Theatre Name */}
          <h4 className="text-lg font-semibold text-gray-900 mb-3">
            {theatre}
          </h4>

          {/* Timings */}
          <div className="flex flex-wrap gap-3">
            {grouped[theatre].map(show => (
              <button
                key={show.id}
                onClick={() => navigate(`/shows/${show.id}/seats`)}
                className="px-4 py-2 border border-green-500 text-green-600
                           rounded-md text-sm font-medium
                           hover:bg-green-500 hover:text-white
                           transition"
              >
                {show.showTime}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Empty State */}
      {shows.length === 0 && (
        <p className="text-center text-gray-500 mt-10">
          No shows available for this movie 
        </p>
      )}
    </div>
  );
}