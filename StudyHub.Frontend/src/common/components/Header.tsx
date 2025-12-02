import { Search } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

const Header = () => {

  return (
    <header className="fixed top-0 left-0 right-0 h-[65px] flex items-center justify-between px-3 bg-sky-300 text-white z-1">
      <div className="flex items-center">
        <a href="/"><img src="/StudyHubLogo.png" className="w-32" /></a>
      </div>
      <div className="flex-1 mx-6 flex justify-center relative"></div>
      <Button className="bg-sky-400 border-2 border-sky-600 hover:bg-sky-500 hover:text-sky-700" onClick={() => location.href = '/auth/login'}>
        Đăng nhập
      </Button>
    </header>
  );
};

export default Header;