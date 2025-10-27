import { Avatar, AvatarFallback, AvatarImage } from "@/common/components/ui/avatar";
import type { IFeaturedTeacher } from "../interfaces/IFeaturedTeacher";

const FeaturedTeachers = ({ data }: { data: IFeaturedTeacher[] }) => {

  const getFirstTwoLetters = (name: string) => {
    return name.split(" ").slice(0, 2).map(n => n.charAt(0)).join("").toUpperCase();
  }

  return (
    <div className="w-full flex flex-col items-center">
      <h1 className="mt-5 text-2xl py-2 font-bold text-center">
        GIÁO VIÊN NỔI BẬT
      </h1>
      {
        data.length === 0 ? (
          <div className="w-full text-center italic">Không có dữ liệu!</div>
        ) : (
          <div className="grid grid-cols-5 w-full px-20 place-items-center gap-5">
            {data.map((teacher, index) => (
              <div key={index} className="w-full flex flex-col items-center">
                <Avatar className="w-40 h-40 mx-auto">
                  <AvatarImage src={teacher.imageUrl} alt={teacher.name} />
                  <AvatarFallback className="text-4xl">{getFirstTwoLetters(teacher.name)}</AvatarFallback>
                </Avatar>
                <div className="font-bold text-center mt-2">{teacher.name}</div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  )
};

export default FeaturedTeachers;
