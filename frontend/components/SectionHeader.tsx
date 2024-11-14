interface SectionHeaderProps {
    title: string;
  }
  
  const SectionHeader: React.FC<SectionHeaderProps> = ({ title }) => {
    return (
      <div className="ml-9 mt-4">
        <h3 className="text-xl font-bold text-white pb-1 inline-block relative">
          {title}
          <span className="absolute bottom-0 left-0 w-[550%] h-[2.5px] bg-teal-500 mt-1 rounded-full"></span>
        </h3>
      </div>
    );
  };
  
  export default SectionHeader;