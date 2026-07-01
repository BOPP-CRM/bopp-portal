import Profile from "./Profile";

export default function Top() {
  return (
    <div className="hidden md:flex h-18 w-full bg-white border-gray-10 shadow-[0_4px_10px_0_rgba(0,0,0,0.1)] justify-end items-center px-8">
      <Profile />
    </div>
  );
}
