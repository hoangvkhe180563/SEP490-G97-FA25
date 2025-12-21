import { BookOpen, GraduationCap } from "lucide-react";
import type { IFeaturedDocument } from "../interfaces/IFeaturedDocument";
import { Link } from "react-router-dom";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/common/components/ui/carousel";
import React from "react";
import Autoplay from "embla-carousel-autoplay";

const FeaturedDocuments = (props: { data: IFeaturedDocument[] }) => {
  const plugin = React.useRef(
    Autoplay({ delay: 2000, stopOnInteraction: true })
  );

  return (
    <div className="w-full flex flex-col items-center py-8">
      <div className="w-full max-w-6xl px-12 mx-auto">
        <h1 className="text-2xl py-2 font-bold text-center mb-4">
          TÀI LIỆU NỔI BẬT
        </h1>
        <p className="text-center italic">Sách giáo khoa, bài tập... được đề xuất nhiều nhất cho học sinh.</p>
        <div className="space-y-6">
          {props.data.length === 0 && (
            <div className="w-full text-center italic">Không có dữ liệu!</div>
          )}

          <Carousel
            plugins={[plugin.current]}
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
            onMouseEnter={plugin.current.stop}
            onMouseLeave={() => plugin.current.play()}
          >
            <CarouselContent className="-ml-4 my-3">
              {props.data.map((book) => (
                <CarouselItem
                  key={book.id}
                  className="pl-4 basis-full md:basis-1/2 lg:basis-1/2"
                >
                  <Link
                    to={`/document/details/${book.id}`}
                    className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-md hover:scale-[1.02] transition-transform h-full"
                  >
                    <div className="flex-shrink-0 w-20 h-20 bg-gray-200 rounded-md flex items-center justify-center text-sm overflow-hidden">
                      <img
                        src={book.thumbnail}
                        alt=""
                        className="w-full h-full object-cover rounded-md"
                      />
                    </div>
                    <div className="flex flex-col justify-center">
                      <p
                        className="font-semibold text-lg line-clamp-1"
                        title={book.name}
                      >
                        {book.name}
                      </p>
                      <p className="text-gray-600 text-sm flex items-center gap-1">
                        <BookOpen size={16} className="text-blue-500" /> Môn{" "}
                        <b className="text-gray-800">{book.subjectName}</b>
                      </p>
                      <p className="text-gray-600 text-sm flex items-center gap-1">
                        <GraduationCap size={16} className="text-orange-500" />{" "}
                        Lớp <b className="text-gray-800">{book.grade}</b>
                      </p>
                    </div>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </div>
    </div>
  );
};

export default FeaturedDocuments;
