import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/common/components/ui/button';
import { Repeat, X } from 'lucide-react';
import MultipleFilesCommand from '../components/MultipleFilesCommand';
import type { IDocumentItem } from '../interfaces/IDocumentItem'
import { UiManagementService } from '../services/UiManagementService';
import type { ICourseItem } from '../interfaces/ICourseItem';
import { useNavigate, useParams } from 'react-router-dom';
import { Input } from '@/common/components/ui/input';
import type { ILandingPageUpdateService } from '../interfaces/ILandingPageUpdateService';
import { Textarea } from '@/common/components/ui/textarea';
import { useLoading } from '@/common/hooks/useLoading';

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
  const [error, setError] = useState<string[]>([]);
  const [selectedLogo, setSelectedLogo] = useState<IBanner | null>(null);
  const [selectedImages, setSelectedImages] = useState<ILogo[]>([]);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const { schoolId } = useParams();
  const { setLoading } = useLoading();
  const [allDocuments, setAllDocuments] = useState<IDocumentItem[]>([]);
  const [featuredDocuments, setFeaturedDocuments] = useState<number[]>([]);
  const [allCourses, setAllCourses] = useState<IDocumentItem[]>([]);
  const [featuredCourses, setFeaturedCourses] = useState<number[]>([]);
  const [landingPageData, setLandingPageData] = useState<ILandingPageUpdateService>({
    bannerImage: null,
    description: '',
    featuredCourses: [],
    featuredTeachers: [],
    featuredDocuments: [],
    newLandingPageImages: [],
    deletedLandingPageImages: []
  });
  const uiManagementService = new UiManagementService();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if (schoolId) {
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
          description: landingPageData.description,
          featuredCourses: landingPageData.featuredCourses.map(course => course.id),
          featuredDocuments: landingPageData.featuredDocuments.map(doc => doc.id),
          featuredTeachers: landingPageData.featuredTeachers.map(teacher => teacher.id),
          newLandingPageImages: [],
          deletedLandingPageImages: []
        });
        setSelectedLogo({ file: null, url: landingPageData.bannerImage });
        setSelectedImages(landingPageData.introductionImage.map(img => {
          return {
            file: null,
            url: img,
            isNew: false
          }
        }));
      } else {
        navigate("/");
      }
    }

    fetchData().catch(console.error).finally(() => setLoading(false));
  }, [])

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
      if (selectedImages.length === 3) {
        setError(["Đã đạt giới hạn số ảnh logo!"]);
      } else {
        setError([]);
        const imgUrl = URL.createObjectURL(file);
        setSelectedImages([...selectedImages, { file: file, url: imgUrl, isNew: true }]);

        setLandingPageData(prevData => ({
          ...prevData,
          newLandingPageImages: [...landingPageData.newLandingPageImages, file]
        }))
      }
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
      setSelectedLogo({ file: file, url: imgUrl });

      setLandingPageData(prevData => ({
        ...prevData,
        bannerImage: file
      }))
    }
  }

  const handleRemoveFile = (imageIndex: number) => {
    setError([]);
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
    let error = [];
    if (!Number(schoolId)) {
      error.push("Có lỗi xảy ra, vui lòng thử lại!");
      return;
    }
    if (selectedImages.length === 0) {
      error.push("Vui lòng chọn ít nhất 1 logo trường!");
    }
    if (landingPageData.description.length === 0) {
      error.push("Mô tả không được để trống!");
    }

    if (error.length > 0) {
      setError(error);
      return;
    }

    const result = await uiManagementService.updateLandingPage(Number(schoolId), landingPageData);
    if (result) {
      alert(result);
    } else {
      alert('success');
      navigate(`/ui/${schoolId}/landing`);
    }
  };

  const handleCancel = () => {
    location.href = `/ui/${schoolId}/landing`
  };

  return (
    <div className="w-full h-full overflow-y-auto">
      <div className='max-w-3xl mx-auto my-12 p-8 rounded-lg shadow-xl border border-gray-200'>
        {error.length > 0 && (
          <div className='border border-red-500 bg-red-200 mb-2 px-2 py-2 flex items-center'>
            <ul className='flex-1'>
              {error.map((e, index) => <li key={`error-${index}`}>{e}</li>)}
            </ul>
            <button onClick={() => setError([])}>
              <X className='stroke-gray-600' />
            </button>
          </div>
        )}
        <div className="grid md:grid-cols-3 gap-x-12 gap-y-8">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Banner trường <span className='text-red-500'>*</span></label>
          </div>
          <Input ref={imgInputRef} type='file' className='md:col-span-2' onChange={handleBannerUpload} />

          {selectedLogo && (
            <>
              <div className="md:col-span-1"></div>
              <div className='md:col-span-2 shadow-lg rounded-md h-[200px]'>
                <img src={selectedLogo.url} className='w-full h-full object-contain' alt='No Image' />
              </div>
            </>
          )}

          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Logo giới thiệu trường <span className='text-red-500'>*</span></label>
          </div>
          <Input ref={imgInputRef} type='file' className='md:col-span-2' onChange={handleFileUpload} />

          {
            selectedImages.length > 0 && <>
              <div className="md:col-span-1"></div>
              <div className="md:col-span-2 flex justify-between space-x-3 h-[150px]">
                {selectedImages.map((image, index) => (
                  <div className='rounded-md relative w-1/3 shadow-md' key={`image-${index}`}>
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
          <div className="md:col-span-2 flex justify-between space-x-3 h-[150px]">
            <Textarea placeholder='Nhập mô tả trường...' value={landingPageData.description} onChange={(e) => handleDescriptionChange(e)} maxLength={500} />
          </div>

          <div className="md:col-span-1 mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tài liệu nổi bật <br />
              <span className="text-red-500 text-xs font-normal">(Chọn tối đa 5 tài liệu)</span>
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
              maxSelections={5}
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
          </div>

          <div className="md:col-span-1 mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Khoá học nổi bật <br />
              <span className="text-red-500 text-xs font-normal">(Chọn tối đa 3 khoá học)</span>
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
              maxSelections={3}
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