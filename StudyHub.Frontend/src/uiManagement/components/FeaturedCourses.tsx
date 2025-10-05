import { BookOpen, GraduationCap, Users } from "lucide-react";
import type { IFeaturedCourse } from "../interfaces/IFeaturedCourse";

const FeaturedCourses = (props: { data: IFeaturedCourse[] }) => {

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-4/5">
        <h1 className='mt-5 text-2xl py-2 font-bold text-center'>KHÓA HỌC NỔI BẬT</h1>
        <div className="space-y-8 mb-5">
          {props.data.map((course) => (
            <div key={course.id} className="flex items-center gap-6 p-6 bg-white rounded-lg shadow-md">
              <div className="flex-shrink-0 w-32 h-20 bg-gray-200 rounded-md flex items-center justify-center text-sm font-semibold text-gray-600">
                <img src={course.image} alt="" />
              </div>
              <div className="flex-grow">
                <p className="text-xl font-semibold mb-2">Khoá học {course.name}</p>
                <div className="flex items-center gap-4 text-gray-700 text-sm">
                  <span className="flex items-center gap-1">
                    <BookOpen className="fill-blue-500 stroke-blue-500"/> Môn {course.subject}
                  </span>
                  <span className="flex items-center gap-1">
                    <GraduationCap className="fill-orange-500 stroke-orange-500"/> Khối {course.grade}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="fill-lime-500 stroke-lime-500"/> {course.numberOfStudents} học sinh đang học
                  </span>
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                {course.price === 0 ? (
                  <span className="text-blue-600 font-semibold">Miễn phí</span>
                ) : (
                  <span className="bg-red-500 text-white px-3 py-1 rounded-md text-sm font-bold">
                    {course.price}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default FeaturedCourses