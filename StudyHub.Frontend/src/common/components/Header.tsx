import { Search } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Link } from "react-router-dom";

const Header = () => {

  return (
    <header className="fixed top-0 left-0 right-0 h-[65px] flex items-center justify-between px-3 bg-sky-300 text-white z-1">
      <div className="flex items-center space-x-5">
        <a href="/"><img src="/StudyHubLogo.png" className="w-32" /></a>
        <Link to={"/document/documents"} className="font-bold transition-colors hover:text-sky-100">
          Tài liệu
        </Link>
        <Link to={"/course/student/courses"} className="font-bold transition-colors hover:text-sky-100">
          Khóa học
        </Link>
      </div>
      <div className="flex-1 mx-6 flex justify-center relative">
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Tìm kiếm khóa học..."
            className="pl-8 w-96 border-2 border-black bg-white text-black"
          />
        </div>
      </div>
      <div className="space-x-3">
        <Link to={'/auth/login'}>
          <Button className="border-2 bg-white text-black border-sky-600 hover:bg-sky-500 hover:text-sky-700">
            Đăng nhập
          </Button>
        </Link>
        <Link to={'/auth/register'}>
          <Button className="bg-sky-400 border-2 border-sky-600 hover:bg-sky-500 hover:text-sky-700" onClick={() => location.href = '/auth/register'}>
            Đăng ký
          </Button>
        </Link>
      </div>
    </header>
  );
};

export default Header;