// src/components/LandingPageEdit.jsx
import React, { useEffect, useState } from 'react';
import { Button } from '@/common/components/ui/button';
import { Upload, X, FileText, Check } from 'lucide-react'; // From lucide-react
import MultipleFilesCommand from '../components/MultipleFilesCommand';
import type { IDocumentItem } from '../interfaces/IDocumentItem';
import { UiManagementService } from '../services/UiManagementService';
import type { ICourseItem } from '../interfaces/ICourseItem';

const colorPalette = [
  'bg-gray-700', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-emerald-500', 'bg-teal-500',
  'bg-cyan-500', 'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500', 'bg-rose-500',
];

interface ISchoolLogo {
  name: string,
  size: string
}

const LandingPageEdit = () => {
  const [selectedLogo, setSelectedLogo] = useState<ISchoolLogo | null>({ name: 'example.png', size: '1.5 MB' });
  const [selectedColor, setSelectedColor] = useState('bg-blue-500');
  const [allDocuments, setAllDocuments] = useState<IDocumentItem[]>([]);
  const [featuredDocuments, setFeaturedDocuments] = useState<number[]>([]);
  const [allCourses, setAllCourses] = useState<IDocumentItem[]>([]);
  const [featuredCourses, setFeaturedCourses] = useState<number[]>([]);
  const uiManagementService = new UiManagementService();

  useEffect(() => {
    const documentData = uiManagementService.getAllDocuments();
    setAllDocuments(documentData);
    setFeaturedDocuments([1, 2]);
    const courseData = uiManagementService.getAllCourses();
    setAllCourses(courseData);
    setFeaturedCourses([1, 3]);
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
      setSelectedLogo({
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      });
    }
  };

  const removeUploadedLogo = () => {
    setSelectedLogo(null);
  };

  const handleSave = () => {
    console.log("Saving changes... Mock data", {
      selectedLogo,
      selectedColor,
      featuredDocuments,
      featuredCourses,
    });
  };

  const handleCancel = () => {
    location.href = '/'
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-xl max-w-3xl mx-auto my-12 border border-gray-200">
      <div className="grid md:grid-cols-3 gap-x-12 gap-y-8">
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Logo trường</label>
        </div>
        <div className="md:col-span-2 border border-dashed border-gray-300 p-6 rounded-md text-center bg-gray-50 flex flex-col items-center justify-center space-y-4">
          <FileText className="h-10 w-10 text-gray-400" />
          <p className="text-gray-600 text-sm">Kéo thả file vào đây</p>
          <p className="text-gray-500 text-xs">hoặc</p>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            onChange={handleFileUpload}
            accept=".png,.jpg,.jpeg,.svg"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Upload className="h-4 w-4 mr-2" /> Thêm file...
          </label>
        </div>

        {selectedLogo && (
          <>
            <div className="md:col-span-1"></div>
            <div className="md:col-span-2 flex items-center justify-between bg-gray-100 p-3 rounded-md border border-gray-200">
              <span className="text-sm font-medium text-gray-800">{selectedLogo.name} <span className="text-gray-500 text-xs"> {selectedLogo.size}</span></span>
              <Button variant="ghost" size="icon" onClick={removeUploadedLogo}>
                <X className="h-4 w-4 text-gray-500" />
              </Button>
            </div>
          </>
        )}

        <div className="md:col-span-1 mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Màu chủ đạo</label>
        </div>
        <div className="md:col-span-2 mt-6 grid grid-cols-7 gap-2">
          {colorPalette.map((colorClass, index) => (
            <div
              key={index}
              className={`w-8 h-8 rounded-full cursor-pointer border-2 flex items-center justify-center ${selectedColor === colorClass ? 'border-blue-500 ring-2 ring-blue-300' : 'border-transparent'} ${colorClass}`}
              onClick={() => setSelectedColor(colorClass)}
            >
              {selectedColor === colorClass && <Check size={16} className='stroke-white'/>}
            </div>
          ))}
        </div>

        <div className="md:col-span-1 mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tài liệu nổi bật <br />
            <span className="text-red-500 text-xs font-normal">(Chọn tối đa 3 tài liệu)</span>
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
            maxSelections={3}
          />
          {/* <Select onValueChange={handleDocumentSelect} value="">
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Chọn tài liệu..." />
            </SelectTrigger>
            <SelectContent>
              {availableDocuments
                .filter(doc => !featuredDocuments.some(fDoc => fDoc.id === doc.id))
                .map(doc => (
                  <SelectItem key={doc.id} value={doc.id}>
                    {doc.name} ({doc.subject} - {doc.grade})
                  </SelectItem>
                ))}
            </SelectContent>
          </Select> */}
          <div className="mt-4 space-y-2">
            {featuredDocuments.map((docId) => {
              const docObj = allDocuments.find(doc => doc.id === docId);
              return (
                docObj && <div key={docObj.id} className="flex items-center justify-between bg-gray-100 px-3 rounded-md border border-gray-200">
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
          {/* <Select onValueChange={handleCourseSelect} value="">
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Chọn khóa học..." />
            </SelectTrigger>
            <SelectContent>
              {availableCourses
                .filter(course => !featuredCourses.some(fCourse => fCourse.id === course.id)) // Only show unselected courses
                .map(course => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name} ({course.subject} - {course.grade})
                  </SelectItem>
                ))}
            </SelectContent>
          </Select> */}
          <div className="mt-4 space-y-2">
            {featuredCourses.map((courseId) => {
              const courseObj = allCourses.find(course => course.id === courseId);
              return (courseObj && <div key={courseObj.id} className="flex items-center justify-between bg-gray-100 px-3 rounded-md border border-gray-200">
                <span className="text-sm font-medium text-gray-800">{courseObj.name} <span className="text-gray-500 text-xs">(Môn {courseObj.subject} - Lớp {courseObj.grade})</span></span>
                <Button variant="ghost" size="icon" onClick={() => removeCourse(courseObj.id)}>
                  <X className="h-4 w-4 text-gray-500" />
                </Button>
              </div>)
            })}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4 mt-12 pt-6 border-t border-gray-200">
        <Button variant="outline" className="px-6" onClick={handleCancel}>
          Hủy bỏ thay đổi
        </Button>
        <Button className="px-6 bg-gray-800 hover:bg-gray-700 text-white" onClick={handleSave}>
          Lưu thay đổi
        </Button>
      </div>
    </div>
  );
};

export default LandingPageEdit;