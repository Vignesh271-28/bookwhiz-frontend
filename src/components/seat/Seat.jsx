export default function Seat({ seat, selected, disabled, isLockedByOther, onClick }) {

  const getStyle = () => {
    if (seat.booked)     return "bg-red-500 cursor-not-allowed text-white opacity-70";
    if (isLockedByOther) return "bg-yellow-400 cursor-not-allowed text-white opacity-70";
    if (selected)        return "bg-green-500 cursor-pointer text-white";
    return "bg-gray-300 cursor-pointer hover:bg-gray-400 text-gray-800";
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={
        isLockedByOther
          ? "Locked by another user"
          : seat.booked
          ? "Already booked"
          : seat.seatNumber
      }
      className={`w-14 h-14 rounded-lg text-sm font-semibold transition ${getStyle()}`}
    >
      {seat.seatNumber ?? seat.id}
    </button>
  );
}