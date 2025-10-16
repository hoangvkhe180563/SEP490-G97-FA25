import { CircleUser, EllipsisVertical, LogOut, Search } from "lucide-react";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Button } from "./ui/button";

const Header = (props: {isLoggedIn: boolean}) => {
  return (
    <header className="h-[65px] flex items-center justify-between px-3 bg-sky-300 text-white">
      {/* Logo */}
      <div className="flex items-center">
        <a href="#"><img src="src/common/assets/StudyHubLogo.png" className="w-32" /></a>
      </div>
      {/* Search */}
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
      {/* User Info */}
      {props.isLoggedIn ? (
        <div className="flex items-center max-w-[250px] justify-between space-x-3">
          <div className="flex justify-center items-center space-x-3 overflow-x-hidden">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="text-black">U</AvatarFallback>
            </Avatar>
            <span
              className="flex-1 font-medium truncate"
              title="User ABC"
            >
              User ABC
            </span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="p-2 hover:bg-sky-400 hover:text-white">
                <EllipsisVertical className="h-5 w-5 cursor-pointer" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-50 mt-3">
              <DropdownMenuItem>
                <CircleUser className="mr-2 h-4 w-4" /> Thông tin cá nhân
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                <LogOut className="mr-2 h-4 w-4 stroke-red-600" /> <span className="ư-full hover:text-red-600">Đăng xuất</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : (
        <Button className="bg-sky-400 border-2 border-sky-600 hover:bg-sky-500 hover:text-sky-700">
          Đăng nhập
        </Button>
      )}
    </header>
  );
};

export default Header;