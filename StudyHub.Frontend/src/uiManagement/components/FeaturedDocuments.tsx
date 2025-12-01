import { BookOpen, GraduationCap } from "lucide-react";
import type { IFeaturedDocument } from "../interfaces/IFeaturedDocument"
import { Link } from "react-router-dom";

const FeaturedDocuments = (props: { data: IFeaturedDocument[] }) => {

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-4/5">
        <h1 className='text-2xl py-2 font-bold text-center'>TÀI LIỆU NỔI BẬT</h1>
        <div className="container mx-auto space-y-6">
          {props.data.length === 0 && <div className="w-full text-center italic">Không có dữ liệu!</div>}
          {props.data.map((book) => (
            <Link to={`/document/student/details/${book.id}`} key={book.id} className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm hover:scale-103 transition-transform">
              <div className="flex-shrink-0 w-20 h-20 object-cover bg-gray-200 rounded-md flex items-center justify-center text-sm text-gray-600 overflow-hidden">
                <img src={book.thumbnail} alt="" className="w-20 h-auto object-cover rounded-md" />
              </div>
              <div>
                <p className="font-semibold text-lg">{book.name}</p>
                <p className="text-gray-600 text-sm flex items-center gap-1">
                  <BookOpen size={16} className="fill-blue-500 stroke-blue-500" /> Môn <b>{book.subjectName}</b>
                </p>
                <p className="text-gray-600 text-sm flex items-center gap-1">
                  <GraduationCap size={16} className="fill-orange-500 stroke-orange-500" /> Lớp <b>{book.grade}</b>
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default FeaturedDocuments