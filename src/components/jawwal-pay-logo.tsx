import jawwalPayLogoUrl from "@/assets/Jawwal_Pay.svg";

export function JawwalPayLogo({
  className = "size-11",
}: {
  className?: string;
}) {
  return (
    <img
      src={jawwalPayLogoUrl}
      alt="Jawwal Pay"
      className={`shrink-0 rounded-xl object-contain ${className}`}
    />
  );
}
