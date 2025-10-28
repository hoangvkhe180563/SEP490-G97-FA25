import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/common/components/ui/table"
import { useEffect, useState } from "react"
import { UiManagementService } from "../services/UiManagementService"
import type { ILandingPageListItem } from "../interfaces/ILandingPageListItem";
import { Button } from "@/common/components/ui/button";
import { Pencil } from "lucide-react";

const LandingPageList = () => {
  const [landingPageList, setLandingPageList] = useState<ILandingPageListItem[]>([]);
  const service = new UiManagementService();
  useEffect(() => {
    const fetchData = async () => {
      const listItem = await service.getLandingPageList();
      setLandingPageList(listItem);
    }

    fetchData().catch(console.error);
  })
  return (
    <div className="w-full h-full">
      <div className="mx-auto w-4/5 my-12 shadow-lg rounded-lg overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px] text-center">Id</TableHead>
              <TableHead className="text-center">Tên trường</TableHead>
              <TableHead className="text-center">Chỉnh sửa</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {landingPageList.map((item) => (
              <TableRow key={`landing-${item.schoolId}`} className="border-gray-300">
                <TableCell className="font-medium text-center">{item.schoolId}</TableCell>
                <TableCell className="flex items-center p-2 gap-3">
                  <img src={item.schoolLogoUrl} className="w-40 h-20" />
                  <h2 className="text-lg">{item.schoolName}</h2>
                </TableCell>
                <TableCell>
                  <div className="flex justify-center">
                    <Button variant="outline" size="icon" className="cursor-pointer" onClick={() => location.href = `/ui/${item.schoolId}/landing/edit`}>
                      <Pencil />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default LandingPageList