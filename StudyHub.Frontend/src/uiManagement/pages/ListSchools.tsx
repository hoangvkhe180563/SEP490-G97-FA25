import React, { useEffect, useState } from 'react';
import { Search, MapPin, School as SchoolIcon, Pencil, Plus } from 'lucide-react';
import { Input } from '@/common/components/ui/input';
import { Card } from '@/common/components/ui/card';
import { Button } from '@/common/components/ui/button';
import { Paging } from '@/common/components/Paging';
import { useLoading } from '@/common/hooks/useLoading';
import { UiManagementService } from '../services/UiManagementService';
import type { School } from '../interfaces/School';
import { Link } from 'react-router-dom';

const ITEMS_PER_PAGE = 6;

export default function ListSchools() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [schools, setSchools] = useState<School[]>([]);
  const filteredSchools = schools.filter((school) =>
    school.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalPages = Math.ceil(filteredSchools.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentSchools = filteredSchools.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const { setLoading } = useLoading();
  const uiService = new UiManagementService();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const schoolData = await uiService.getSchools();
      setSchools(schoolData);
    }

    fetchData().catch(console.error).finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Quản lý danh sách các trường</h1>
          </div>

          <div className="relative w-full md:w-120">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              type="text"
              placeholder="Tìm trường..."
              value={searchQuery}
              onChange={handleSearch}
              className="pl-10"
            />
          </div>
        </div>

        <Link to={'/ui/schools/add'} className="inline-block">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Thêm trường mới
          </Button>
        </Link>

        {currentSchools.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {currentSchools.map((school) => (
              <Card key={school.id} className="group overflow-hidden flex flex-col hover:shadow-md transition-shadow duration-300">

                <div className="relative h-48 w-full overflow-hidden bg-slate-200">
                  <img
                    src={school.banner}
                    alt={`${school.name} banner`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>

                <div className="relative flex flex-1 flex-col px-6 pb-6 pt-0">
                  <div className="-mt-10 mb-4 inline-flex">
                    <div className="rounded-full border-4 border-white bg-white p-1 shadow-sm">
                      <img
                        src={school.logo}
                        alt={`${school.name} logo`}
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col gap-2">
                    <h3 className="text-xl font-semibold text-slate-900 line-clamp-1" title={school.name}>
                      {school.name}
                    </h3>

                    <div className="flex items-center text-sm text-slate-500 mb-2">
                      <MapPin className="mr-1.5 h-4 w-4 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {school.address}
                      </span>
                    </div>

                    <p className="text-sm text-slate-600 line-clamp-2 mb-2 flex-1">
                      {school.description}
                    </p>

                    <Button variant="outline" className="w-full mt-auto">
                      <Pencil /> Chỉnh sửa
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="rounded-full bg-slate-100 p-4 mb-4">
              <SchoolIcon className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-3xl font-medium text-slate-900">Không có dữ liệu!</h3>
          </div>
        )}

        {filteredSchools.length > ITEMS_PER_PAGE && (
          <Paging
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={page => setCurrentPage(page)}
          />
        )}
      </div>
    </div>
  );
}