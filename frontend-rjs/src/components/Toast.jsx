export default function Toast({ message, type = "success" }) {
  if (!message) return null;

  return (
    <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-7 py-3 rounded-full font-nunito font-bold text-sm shadow-xl z-50 transition-all duration-300 ease-in-out animate-fade-in
      ${type === "success" ? "bg-green-700 text-white" : "bg-red-600 text-white"}`}
    >
      {message}
    </div>
  );
}
