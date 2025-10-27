import { BookOpen, GraduationCap } from "lucide-react";
import type { IFeaturedDocument } from "../interfaces/IFeaturedDocument"

const FeaturedDocuments = (props: { data: IFeaturedDocument[] }) => {

  const textbooks: IFeaturedDocument[] = props.data.filter(item => item.documentCategory === 1);
  const references: IFeaturedDocument[] = props.data.filter(item => item.documentCategory === 4);

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-4/5">
        <h1 className='text-2xl py-2 font-bold text-center'>TÀI LIỆU NỔI BẬT</h1>
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* SÁCH GIÁO KHOA */}
          <div>
            <h3 className="text-2xl font-semibold mb-6 text-gray-800 text-center">SÁCH GIÁO KHOA</h3>
            <div className="space-y-6">
              {textbooks.length === 0 && <div className="w-full text-center italic">Không có dữ liệu!</div>}
              {textbooks.map((book) => (
                <div key={book.id} className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm">
                  <img src={book.thumbnail} alt={book.name} className="w-20 h-auto object-cover rounded-md" />
                  <div>
                    <p className="font-semibold text-lg">{book.name}</p>
                    <p className="text-gray-600 text-sm flex items-center gap-1">
                      <BookOpen size={16} className="fill-blue-500 stroke-blue-500" /> Môn <b>{book.subjectName}</b>
                    </p>
                    <p className="text-gray-600 text-sm flex items-center gap-1">
                      <GraduationCap size={16} className="fill-orange-500 stroke-orange-500" /> Lớp <b>{book.grade}</b>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SÁCH THAM KHẢO */}
          <div>
            <h3 className="text-2xl font-semibold mb-6 text-gray-800 text-center">SÁCH THAM KHẢO</h3>
            <div className="space-y-6">
              {references.length === 0 && <div className="w-full text-center italic">Không có dữ liệu!</div>}
              {references.map((book) => (
                <div key={book.id} className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm">
                  <img src={book.thumbnail} alt={book.name} className="w-20 h-auto object-cover rounded-md" />
                  <div>
                    <p className="font-semibold text-lg">{book.name}</p>
                    <p className="text-gray-600 text-sm flex items-center gap-1">
                      <BookOpen size={16} className="fill-blue-500 stroke-blue-500" /> Môn <b>{book.subjectName}</b>
                    </p>
                    <p className="text-gray-600 text-sm flex items-center gap-1">
                      <GraduationCap size={16} className="fill-orange-500 stroke-orange-500" /> Lớp <b>{book.grade}</b>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FeaturedDocuments