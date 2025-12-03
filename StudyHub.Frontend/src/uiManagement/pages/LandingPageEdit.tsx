import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/common/components/ui/button';
import { Repeat, X } from 'lucide-react';
import MultipleFilesCommand from '../components/MultipleFilesCommand';
import type { IDocumentItem } from '../interfaces/IDocumentItem'
import { UiManagementService } from '../services/UiManagementService';
import type { ICourseItem } from '../interfaces/ICourseItem';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/common/components/ui/input';
import type { ILandingPageUpdateService } from '../interfaces/ILandingPageUpdateService';
import { Textarea } from '@/common/components/ui/textarea';
import { useLoading } from '@/common/hooks/useLoading';
import { useAuthStore } from '@/auth/stores/useAuthStore';
import { ROLES } from '@/common/constants/Roles';
import toast from 'react-hot-toast';

interface IBanner {
  url: string,
  file: File | null
}

interface ILogo {
  url: string,
  file: File | null,
  isNew: boolean
}

const LandingPageEdit = () => {
  const [selectedBanner, setSelectedBanner] = useState<IBanner | null>(null);
  const [selectedLogo, setSelectedLogo] = useState<IBanner | null>(null);
  const [selectedImages, setSelectedImages] = useState<ILogo[]>([]);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const { setLoading } = useLoading();
  const [allDocuments, setAllDocuments] = useState<IDocumentItem[]>([]);
  const [featuredDocuments, setFeaturedDocuments] = useState<number[]>([]);
  const [allCourses, setAllCourses] = useState<IDocumentItem[]>([]);
  const [featuredCourses, setFeaturedCourses] = useState<number[]>([]);
  const [landingPageData, setLandingPageData] = useState<ILandingPageUpdateService>({
    bannerImage: null,
    logoImage: null,
    description: '',
    featuredCourses: [],
    featuredDocuments: [],
    newLandingPageImages: [],
    deletedLandingPageImages: []
  });
  const [descriptionError, setDescriptionError] = useState<string>('');
  const [imagesError, setImagesError] = useState<string>('');
  const [documentsError, setDocumentsError] = useState<string>('');
  const [coursesError, setCoursesError] = useState<string>('');
  const [schoolId, setSchoolId] = useState<number>(0);
  const uiManagementService = new UiManagementService();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        return;
      }
      const schoolId = user.schoolId;
      if (!schoolId || !user.roles.some(r => [ROLES.UI_MANAGER, ROLES.SCHOOL_ADMIN].includes(r))) {
        toast.error("Bạn không có quyền truy cập!");
        navigate("/");
      }
      setSchoolId(schoolId);
      setLoading(true);
      const schoolIdInt = Number(schoolId);
      const documentData = await uiManagementService.getAllDocuments(schoolIdInt);
      setAllDocuments(documentData);
      setFeaturedDocuments(documentData.filter(doc => doc.isFeatured).map(doc => doc.id));
      const courseData = await uiManagementService.getAllCourses(schoolIdInt);
      setAllCourses(courseData);
      setFeaturedCourses(courseData.filter(c => c.isFeatured).map(c => c.id));

      const landingPageData = await uiManagementService.getLandingPageSchool(schoolIdInt);

      setLandingPageData({
        bannerImage: null,
        logoImage: null,
        description: landingPageData.description,
        featuredCourses: landingPageData.featuredCourses.map(course => course.id),
        featuredDocuments: landingPageData.featuredDocuments.map(doc => doc.id),
        newLandingPageImages: [],
        deletedLandingPageImages: []
      });
      setSelectedBanner({ file: null, url: landingPageData.bannerImage });
      setSelectedLogo({ file: null, url: landingPageData.logoImage });
      setSelectedImages(landingPageData.introductionImage.map(img => {
        return {
          file: null,
          url: img,
          isNew: false
        }
      }));
    }

    fetchData().catch(console.error).finally(() => setLoading(false));
  }, [user])

  const handleDocumentSelect = (item: IDocumentItem) => {
    setFeaturedDocuments((docIds) => [...docIds, item.id]);
  };

  const removeDocument = (id: number) => {
    setFeaturedDocuments(featuredDocuments.filter(docId => docId !== id));
  };

  const handleCourseSelect = (item: ICourseItem) => {
    setFeaturedCourses((courseIds) => [...courseIds, item.id]);
  };

  const removeCourse = (id: number) => {
    setFeaturedCourses(featuredCourses.filter(courseId => courseId !== id));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      const imgUrl = URL.createObjectURL(file);
      setSelectedImages([...selectedImages, { file: file, url: imgUrl, isNew: true }]);

      setLandingPageData(prevData => ({
        ...prevData,
        newLandingPageImages: [...landingPageData.newLandingPageImages, file]
      }))
    }
    imgInputRef.current!.value = '';
  };

  const handleDescriptionChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    setLandingPageData(prevData => ({
      ...prevData,
      description: value
    }))
  }

  useEffect(() => {
    setLandingPageData(prevData => ({
      ...prevData,
      featuredDocuments: featuredDocuments
    }))
  }, [featuredDocuments])

  useEffect(() => {
    setLandingPageData(prevData => ({
      ...prevData,
      featuredCourses: featuredCourses
    }))
  }, [featuredCourses])

  const handleBannerUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      const imgUrl = URL.createObjectURL(file);
      setSelectedBanner({ file: file, url: imgUrl });

      setLandingPageData(prevData => ({
        ...prevData,
        bannerImage: file
      }))
    }
  }

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      const imgUrl = URL.createObjectURL(file);
      setSelectedLogo({ file: file, url: imgUrl });

      setLandingPageData(prevData => ({
        ...prevData,
        logoImage: file
      }))
    }
  }

  const handleRemoveFile = (imageIndex: number) => {
    const deleteImageUrl = selectedImages[imageIndex];
    if (!deleteImageUrl.isNew) {
      setLandingPageData(prevData => ({
        ...prevData,
        deletedLandingPageImages: [...landingPageData.deletedLandingPageImages, deleteImageUrl.url]
      }))
    }

    const newSelectedImages = selectedImages.filter((_, index) => index !== imageIndex);
    setSelectedImages(newSelectedImages);

    const currentData = newSelectedImages
      .filter(img => img.isNew)
      .map(img => img.file)
      .filter((f): f is File => f != null);
    setLandingPageData(prevData => ({
      ...prevData,
      newLandingPageImages: currentData
    }))
  }

  const handleSave = async () => {
    setLoading(true);
    setDescriptionError('');
    setImagesError('');
    setDocumentsError('');
    setCoursesError('');
    if (!Number(schoolId)) {
      alert("Có lỗi xảy ra, vui lòng thử lại!");
      setLoading(false);
      return;
    }
    if (selectedImages.length === 0) {
      setImagesError("Vui lòng chọn ít nhất 1 logo trường!");
      setLoading(false);
      return;
    }
    if (landingPageData.description.length === 0) {
      setDescriptionError("Mô tả không được để trống!");
      setLoading(false);
      return;
    }

    try {
      const result = await uiManagementService.updateLandingPage(Number(schoolId), landingPageData);
      setLoading(false);
      if (result) {
        throw new Error(result);
      } else {
        toast.success("Cập nhật trang giới thiệu thành công!");
        navigate(`/ui/school-landing`);
      }
    } catch (error) {
      console.error(error);
      toast.error("Cập nhật trang giới thiệu thất bại!")
      setLoading(false);
    }
  };

  const handleCancel = () => {
    location.href = `/ui/school-landing`
  };

  return (
    <div className="w-full h-full overflow-y-auto">
      <div className='max-w-3xl mx-auto my-12 p-8 rounded-lg shadow-xl border border-gray-200'>
        <div className="grid md:grid-cols-3 gap-x-12 gap-y-8">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Banner trường <span className='text-red-500'>*</span></label>
          </div>
          <Input type='file' accept='image/*' className='md:col-span-2' onChange={handleBannerUpload} />

          {selectedBanner && (
            <>
              <div className="md:col-span-1"></div>
              <div className='md:col-span-2 shadow-lg rounded-md h-[200px]'>
                <img src={selectedBanner.url} className='w-full h-full object-contain' alt='No Image' />
              </div>
            </>
          )}

          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Logo trường <span className='text-red-500'>*</span></label>
          </div>
          <Input type='file' accept='image/*' className='md:col-span-2' onChange={handleLogoUpload} />

          {selectedLogo && (
            <>
              <div className="md:col-span-1"></div>
              <div className='md:col-span-2 shadow-lg rounded-md h-[200px]'>
                <img src={selectedLogo.url} className='w-full h-full object-contain' alt='No Image' />
              </div>
            </>
          )}

          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Ảnh giới thiệu trường <span className='text-red-500'>*</span></label>
          </div>
          <div className='md:col-span-2'>
            <Input ref={imgInputRef} accept='image/*' type='file' onChange={handleFileUpload} />
            {imagesError && <p className='text-red-500 font-bold'>{imagesError}</p>}
          </div>

          {
            selectedImages.length > 0 && <>
              <div className="md:col-span-1"></div>
              <div className="md:col-span-2 grid grid-cols-3 justify-between gap-3">
                {selectedImages.map((image, index) => (
                  <div className='rounded-md relative shadow-md aspect-square' key={`image-${index}`}>
                    <button className='absolute right-2 top-2 bg-gray-600 rounded-full text-white px-1 py-1' onClick={() => handleRemoveFile(index)}><X size={15} /></button>
                    <img src={image.url} className='w-full h-full object-contain' alt='No Image' />
                  </div>
                ))}
              </div>
            </>
          }

          <div className='md:col-span-1'>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả giới thiệu <span className='text-red-500'>*</span></label>
          </div>
          <div className="md:col-span-2">
            <Textarea placeholder='Nhập mô tả trường...' value={landingPageData.description} onChange={(e) => handleDescriptionChange(e)} maxLength={500} className='h-[150px]'/>
            {descriptionError && <p className='text-red-500 font-bold'>{descriptionError}</p>}
          </div>

          <div className="md:col-span-1 mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tài liệu nổi bật
            </label>
          </div>
          <div className="md:col-span-2 mt-6">
            <MultipleFilesCommand
              items={allDocuments}
              selectedItems={featuredDocuments}
              onSelect={handleDocumentSelect}
              onRemove={removeDocument}
              placeholder="Tìm kiếm tài liệu..."
              label="Chọn tài liệu..."
            />
            <div className="mt-4 space-y-2">
              {featuredDocuments.map((docId, index) => {
                const docObj = allDocuments.find(doc => doc.id === docId);
                return (
                  docObj && <div key={`doc-${index}`} className="flex items-center justify-between bg-gray-100 px-3 rounded-md border border-gray-200">
                    <span className="text-sm font-medium text-gray-800">{docObj.name} <span className="text-gray-500 text-xs">(Môn {docObj.subject} - Lớp {docObj.grade})</span></span>
                    <Button variant="ghost" size="icon" onClick={() => removeDocument(docObj.id)}>
                      <X className="h-4 w-4 text-gray-500" />
                    </Button>
                  </div>
                )
              })}
            </div>
            {documentsError && <p className='text-red-500 font-bold mt-2'>{documentsError}</p>}
          </div>

          <div className="md:col-span-1 mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Khoá học nổi bật
            </label>
          </div>
          <div className="md:col-span-2 mt-6">
            <MultipleFilesCommand
              items={allCourses}
              selectedItems={featuredCourses}
              onSelect={handleCourseSelect}
              onRemove={removeCourse}
              placeholder="Tìm kiếm khóa học..."
              label="Chọn khóa học..."
            />
            <div className="mt-4 space-y-2">
              {featuredCourses.map((courseId, index) => {
                const courseObj = allCourses.find(course => course.id === courseId);
                return (courseObj && <div key={`course-${index}`} className="flex items-center justify-between bg-gray-100 px-3 rounded-md border border-gray-200">
                  <span className="text-sm font-medium text-gray-800">{courseObj.name} <span className="text-gray-500 text-xs">(Môn {courseObj.subject} - Lớp {courseObj.grade})</span></span>
                  <Button variant="ghost" size="icon" onClick={() => removeCourse(courseObj.id)}>
                    <X className="h-4 w-4 text-gray-500" />
                  </Button>
                </div>)
              })}
            </div>
            {coursesError && <p className='text-red-500 font-bold mt-2'>{coursesError}</p>}
          </div>
        </div>

        <div className='w-full flex justify-between mt-12 pt-6 border-t border-gray-200'>
          <Button variant="outline" className='px-6' onClick={() => location.reload()}><Repeat /> Đặt lại</Button>
          <div className="flex gap-4">
            <Button variant="outline" className="px-6" onClick={handleCancel}>
              Hủy bỏ thay đổi
            </Button>
            <Button className="px-6 bg-gray-800 hover:bg-gray-700 text-white" onClick={handleSave}>
              Lưu thay đổi
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPageEdit;