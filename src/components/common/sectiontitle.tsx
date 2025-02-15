function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mb-16">
      <h2 className="text-5xl font-bold relative z-10 text-gray-800 dark:text-white/80">
        {children}
      </h2>
    </div>
  );
}
export default SectionTitle;
