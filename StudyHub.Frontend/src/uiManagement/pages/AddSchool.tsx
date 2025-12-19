import { Button } from '@/common/components/ui/button';
import { Input } from '@/common/components/ui/input';
import { Label } from '@/common/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/common/components/ui/select';
import { Textarea } from '@/common/components/ui/textarea';
import { ArrowLeft, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { UiManagementService } from '../services/UiManagementService';
import { useLoading } from '@/common/hooks/useLoading';
import { BANK_LIST } from '../constants/BankList';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { ISchoolData } from '../interfaces/ISchoolData';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/common/components/ui/alert-dialog';
import toast from 'react-hot-toast';

interface IItem {
  id: string;
  name: string;
}

interface IFile {
  file: File,
  url: string
}

const formSchema = z.object({
  name: z.string().trim().min(1, "Tên trường là bắt buộc").max(200, "Tên trường không được quá 200 ký tự"),
  address: z.string().trim().min(1, "Địa chỉ là bắt buộc").max(1000, "Địa chỉ không vượt quá 1000 ký tự"),
  cityId: z.string().min(1, "Vui lòng chọn Tỉnh"),
  communeId: z.string().min(1, "Vui lòng chọn Quận/Huyện"),
  banner: z.any().refine((file) => file instanceof File, "Banner là bắt buộc"),
  logo: z.any().refine((file) => file instanceof File, "Logo là bắt buộc"),
  introImages: z.array(z.any()).min(1, "Vui lòng tải lên ít nhất 1 ảnh giới thiệu"),
  description: z.string().trim().min(10, "Mô tả phải có ít nhất 10 ký tự").max(1000, "Mô tả không vượt quá 1000 ký tự"),
  accountName: z.string().trim().min(1, "Tên tài khoản là bắt buộc").max(100, "Tên tài khoản không vượt quá 100 ký tự"),
  accountNumber: z.string().trim().min(1, "Số tài khoản là bắt buộc").max(20, "Số tài khoản không vượt quá 20 ký tự").regex(/^[0-9]+$/, "Số tài khoản chỉ chứa số"),
  conversionRate: z.string().min(1, "Tỷ lệ là bắt buộc").refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Tỷ lệ phải là số dương"),
  bankName: z.string().min(1, "Vui lòng chọn Ngân hàng"),
});

type FormValues = z.infer<typeof formSchema>;

export default function AddSchool() {
  const [cities, setCities] = useState<IItem[]>([]);
  const [communes, setCommunes] = useState<IItem[]>([]);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [imagesPreview, setImagesPreview] = useState<IFile[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  const uiService = new UiManagementService();
  const navigate = useNavigate();
  const { setLoading } = useLoading();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    trigger,
    formState: { errors }
  } = useForm<FormValues>({
    mode: "onChange",
    resolver: zodResolver(formSchema),
    defaultValues: {
      introImages: [],
      name: "",
      address: "",
      cityId: "",
      communeId: "",
      description: "",
      accountName: "",
      accountNumber: "",
      conversionRate: "",
      bankName: ""
    }
  });

  const selectedCityId = watch('cityId');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const cityData = await uiService.getCities();
        setCities(cityData.map(city => ({
          id: city.id.toString(),
          name: city.name
        })));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setLoading]);

  useEffect(() => {
    const fetchCommunes = async () => {
      if (!selectedCityId) {
        setCommunes([]);
        return;
      }
      try {
        const communeData = await uiService.getCommunesByCity(Number(selectedCityId));
        setCommunes(communeData.map(commune => ({
          id: commune.id.toString(),
          name: commune.name
        })));
        setValue('communeId', '');
      } catch (e) {
        console.error(e);
      }
    }
    fetchCommunes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCityId, setValue]);


  const handleBannerUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setBannerPreview(URL.createObjectURL(file));
      setValue('banner', file, { shouldValidate: true });
    }
  }

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setLogoPreview(URL.createObjectURL(file));
      setValue('logo', file, { shouldValidate: true });
    }
  }

  const handleIntroImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      const imgUrl = URL.createObjectURL(file);

      const newPreviewItem = { file, url: imgUrl };
      const updatedPreviews = [...imagesPreview, newPreviewItem];

      setImagesPreview(updatedPreviews);
      const currentFiles = updatedPreviews.map(p => p.file);
      setValue('introImages', currentFiles, { shouldValidate: true });
    }
  };

  const handleRemoveIntroImage = (imageIndex: number) => {
    const updatedPreviews = imagesPreview.filter((_, index) => index !== imageIndex);
    setImagesPreview(updatedPreviews);

    const currentFiles = updatedPreviews.map(p => p.file);
    setValue('introImages', currentFiles, { shouldValidate: true });
  }

  const handleConfirm = async () => {
    const isValid = await trigger();
    if (isValid) {
      setIsDialogOpen(true);
    }
  }

  const onSubmit = async (data: FormValues) => {
    setIsDialogOpen(false);
    const schoolData: ISchoolData = {
      schoolName: data.name,
      address: data.address,
      communeId: Number(data.communeId),
      banner: data.banner,
      logo: data.logo,
      description: data.description,
      currentLandingPageImages: [],
      newLandingPageImages: data.introImages,
      featuredDocumentIds: [],
      featuredCourseIds: [],
      accountName: data.accountName,
      accountBank: data.bankName,
      accountNumber: data.accountNumber,
      exchangeRate: Number(data.conversionRate)
    }
    setLoading(true);
    const success = await uiService.addSchool(schoolData);
    if (success) {
      toast.success("Thêm trường mới thành công!");
      navigate("/ui/schools");
    } else {
      toast.error("Thêm trường mới thất bại!");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white p-6 md:p-10 font-sans text-slate-900">
      <Link to={`/ui/schools`}>
        <Button variant='outline' className='flex items-center'>
          <ArrowLeft />
          <span>Quay lại</span>
        </Button>
      </Link>
      <h2 className='py-6 text-3xl font-bold'>Thêm trường mới</h2>
      <div className="mx-auto max-w-4xl space-y-8">

        <form className="space-y-8">
          <section className="relative rounded-[2.5rem] border border-slate-300 p-8 pt-10">
            <h2 className="absolute -top-4 left-8 bg-white px-2 text-xl font-bold text-slate-900">
              1. Thông tin trường
            </h2>

            <div className="grid gap-6">
              <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[120px_1fr]">
                <Label className='w-[200px] mt-3'>Tên trường <span className='text-red-500'>*</span></Label>
                <div className="w-full">
                  <Input
                    {...register("name")}
                    placeholder="Nhập tên..."
                    className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message?.toString()}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[120px_1fr]">
                <Label className='w-[200px] mt-3'>Địa chỉ <span className='text-red-500'>*</span></Label>
                <div className="w-full">
                  <Input
                    {...register("address")}
                    placeholder="Nhập địa chỉ..."
                    className={errors.address ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {errors.address && <p className="mt-1 text-sm text-red-500">{errors.address.message?.toString()}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[120px_1fr]">
                  <Label className='w-[200px] mt-3'>Tỉnh <span className='text-red-500'>*</span></Label>
                  <div className="w-full">
                    <Controller
                      name="cityId"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className={`w-full ${errors.cityId ? "border-red-500 focus:ring-red-500" : ""}`}>
                            <SelectValue placeholder="Chọn tỉnh..." />
                          </SelectTrigger>
                          <SelectContent>
                            {cities.map(city => (
                              <SelectItem key={city.id} value={city.id}>
                                {city.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.cityId && <p className="mt-1 text-sm text-red-500">{errors.cityId.message?.toString()}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[100px_1fr]">
                  <Label className='mt-3'>Quận/Huyện <span className='text-red-500'>*</span></Label>
                  <div className="w-full">
                    <Controller
                      name="communeId"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCityId}>
                          <SelectTrigger className={`w-full ${errors.communeId ? "border-red-500 focus:ring-red-500" : ""}`}>
                            <SelectValue placeholder="Chọn quận/huyện..." />
                          </SelectTrigger>
                          <SelectContent>
                            {communes.map(commune => (
                              <SelectItem key={commune.id} value={commune.id}>
                                {commune.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.communeId && <p className="mt-1 text-sm text-red-500">{errors.communeId.message?.toString()}</p>}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="relative rounded-[2.5rem] border border-slate-300 p-8 pt-10">
            <h2 className="absolute -top-4 left-8 bg-white px-2 text-xl font-bold text-slate-900">
              2. Giao diện trang chủ
            </h2>

            <div className="space-y-8">
              <div>
                <div className="flex flex-col gap-4 md:flex-row md:items-start">
                  <div className="w-[200px] pt-2">
                    <Label>Banner trường <span className='text-red-500'>*</span></Label>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input
                      type='file'
                      accept='image/*'
                      className={`w-full justify-center border border-dashed bg-slate-50 text-slate-600 hover:bg-slate-100 ${errors.banner ? "border-red-500" : "border-slate-300"}`}
                      onChange={handleBannerUpload}
                    />
                    {errors.banner && <p className="text-sm text-red-500">{errors.banner.message?.toString()}</p>}

                    <div className="overflow-hidden rounded-lg border border-slate-200">
                      {bannerPreview ? (
                        <img src={bannerPreview} alt="Banner" className="h-48 w-full object-contain" />
                      ) : (
                        <div className="h-48 w-full bg-gray-400 flex justify-center items-center font-bold text-white">
                          Banner sẽ hiển thị ở đây.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex flex-col gap-4 md:flex-row md:items-start">
                  <div className="w-[200px] pt-2">
                    <Label>Logo trường <span className='text-red-500'>*</span></Label>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input
                      type='file'
                      accept='image/*'
                      className={`w-full justify-center border border-dashed bg-slate-50 text-slate-600 hover:bg-slate-100 ${errors.logo ? "border-red-500" : "border-slate-300"}`}
                      onChange={handleLogoUpload}
                    />
                    {errors.logo && <p className="text-sm text-red-500">{errors.logo.message?.toString()}</p>}

                    <div className="overflow-hidden w-56 mx-auto rounded-lg border border-slate-200">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="h-48 w-full object-contain" />
                      ) : (
                        <div className="h-48 w-full bg-gray-400 flex justify-center items-center font-bold text-white">
                          Logo sẽ hiển thị ở đây.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex flex-col gap-4 md:flex-row md:items-start">
                  <div className="w-[200px] pt-2">
                    <Label>Ảnh giới thiệu trường <span className='text-red-500'>*</span></Label>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input
                      type='file'
                      accept='image/*'
                      className={`w-full justify-center border border-dashed bg-slate-50 text-slate-600 hover:bg-slate-100 ${errors.introImages ? "border-red-500" : "border-slate-300"}`}
                      onChange={handleIntroImageUpload}
                    />
                    {errors.introImages && <p className="text-sm text-red-500">{errors.introImages.message?.toString()}</p>}

                    {imagesPreview.length > 0 ? (
                      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                        {imagesPreview.map((item, index) => (
                          <div key={`img-${index}`} className="group relative overflow-hidden rounded-lg border border-slate-200">
                            <img src={item.url} alt={`Intro`} className="h-24 w-full object-contain" />
                            <button
                              type="button"
                              className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white hover:bg-red-500 transition-colors"
                              onClick={() => handleRemoveIntroImage(index)}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center w-full text-gray-500">Chưa có ảnh nào.</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 md:flex-row md:items-start">
                <div className="w-[200px] pt-2">
                  <Label>Mô tả <span className='text-red-500'>*</span></Label>
                </div>
                <div className="flex-1">
                  <Textarea
                    {...register("description")}
                    className={`flex-1 h-[100px] ${errors.description ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    placeholder="Nhập mô tả..."
                  />
                  {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description.message?.toString()}</p>}
                </div>
              </div>
            </div>
          </section>

          <section className="relative rounded-[2.5rem] border border-slate-300 p-8 pt-10">
            <h2 className="absolute -top-4 left-8 bg-white px-2 text-xl font-bold text-slate-900">
              3. Thông tin giao dịch
            </h2>

            <div className="grid gap-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="grid grid-cols-1 items-start gap-2 md:grid-cols-[120px_1fr]">
                  <Label className='mt-3'>Tên tài khoản <span className='text-red-500'>*</span></Label>
                  <div className="w-full">
                    <Input
                      {...register("accountName")}
                      placeholder="Nhập tên tài khoản"
                      className={errors.accountName ? "border-red-500 focus-visible:ring-red-500" : ""}
                    />
                    {errors.accountName && <p className="mt-1 text-sm text-red-500">{errors.accountName.message?.toString()}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 items-start gap-2 md:grid-cols-[100px_1fr]">
                  <Label className='mt-3'>Số tài khoản <span className='text-red-500'>*</span></Label>
                  <div className="w-full">
                    <Input
                      {...register("accountNumber")}
                      placeholder="Nhập số tài khoản"
                      className={errors.accountNumber ? "border-red-500 focus-visible:ring-red-500" : ""}
                    />
                    {errors.accountNumber && <p className="mt-1 text-sm text-red-500">{errors.accountNumber.message?.toString()}</p>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="grid grid-cols-1 items-start gap-2 md:grid-cols-[120px_1fr]">
                  <Label className='mt-3'>Tỷ lệ chuyển đổi <span className='text-red-500'>*</span></Label>
                  <div className="w-full">
                    <Input
                      type="number"
                      {...register("conversionRate")}
                      placeholder="Nhập giá"
                      className={errors.conversionRate ? "border-red-500 focus-visible:ring-red-500" : ""}
                    />
                    {errors.conversionRate && <p className="mt-1 text-sm text-red-500">{errors.conversionRate.message?.toString()}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 items-start gap-2 md:grid-cols-[100px_1fr]">
                  <Label className='mt-3'>Ngân hàng <span className='text-red-500'>*</span></Label>
                  <div className="w-full">
                    <Controller
                      name="bankName"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className={`w-full ${errors.bankName ? "border-red-500 focus:ring-red-500" : ""}`}>
                            <SelectValue placeholder="Chọn ngân hàng..." />
                          </SelectTrigger>
                          <SelectContent>
                            {BANK_LIST.map((bank, index) => (
                              <SelectItem key={index} value={bank}>
                                {bank}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.bankName && <p className="mt-1 text-sm text-red-500">{errors.bankName.message?.toString()}</p>}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-4 pt-4">
            <Link to={`/ui/schools`}>
              <Button variant="outline" type="button" className="border-slate-400 font-normal">
                Hủy bỏ
              </Button>
            </Link>
            <Button onClick={handleConfirm} type="button">
              Lưu
            </Button>
          </div>
          <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xác nhận</AlertDialogTitle>
                <AlertDialogDescription>
                  Bạn có muốn thêm trường mới?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setIsDialogOpen(false)}>Hủy bỏ</AlertDialogCancel>
                <AlertDialogAction onClick={handleSubmit(onSubmit)}>Lưu</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </form>
      </div>
    </div>
  );
}