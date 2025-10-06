// import { Button } from "@/common/components/ui/button";
import { Route, Routes } from "react-router-dom";
import AccountList from "../ui/pages/manager/AccountList";
import CreateAccount from "../ui/pages/manager/CreateAccount";
import TeacherLayout from "@/ui/components/layouts/TeacherLayout";
import UpdateAccount from "@/ui/pages/manager/UpdateAccount";
import StudentLayout from "@/ui/components/layouts/StudentLayout";
import StudentProfile from "@/ui/pages/student/StudentProfile";
import ManagerLayout from "@/ui/components/layouts/ManagerLayout";
import ParentLayout from "@/ui/components/layouts/ParentLayout";
import ManagerProfile from "@/ui/pages/manager/ManagerProfile";
import TeacherProfile from "@/ui/pages/teacher/TeacherProfile";
import ParentProfile from "@/ui/pages/parent/ParentProfile";
import DocumentList from "@/ui/pages/DocumentList";
import CreateDocument from "@/ui/pages/teacher/CreateDocument";
import OwnedDocument from "@/ui/pages/teacher/OwnedDocument";
import UpdateDocument from "@/ui/pages/teacher/UpdateDocument";
import DocumentDetails from "@/ui/pages/student/DocumentDetails";
import VerifyDocument from "@/ui/pages/manager/VerifyDocument";
import DocumentInfo from "@/ui/pages/DocumentInfo";
import OwnedDocumentInfo from "@/ui/pages/teacher/DocumentInfo";

function App() {
  return (
    <Routes>
      <Route element={<TeacherLayout />} path="/teacher">
        <Route index element={<div>Dashboard</div>} />
        <Route path="profile" element={<TeacherProfile />} />
        <Route path="documents" element={<DocumentList/>} />
        <Route path="add-document" element={<CreateDocument/>} />
        <Route path="my-document" element={<OwnedDocument/>} />
        <Route path="my-document/update-document" element={<UpdateDocument/>} />
        <Route path="my-document/read" element={<OwnedDocumentInfo/>} />
      </Route>
      <Route element={<ManagerLayout />} path="/manager">
        <Route index element={<div>Dashboard</div>} />
        <Route path="accounts" element={<AccountList />} />
        <Route path="add-account" element={<CreateAccount />} />
        <Route path="update-account" element={<UpdateAccount />} />
        <Route path="profile" element={<ManagerProfile />} />
        <Route path="documents-list" element={<VerifyDocument />} />
        <Route path="documents-list/view" element={<DocumentInfo/>} />
      </Route>
      <Route element={<StudentLayout />} path="/">
        <Route path="profile" element={<StudentProfile />} />
        <Route path="documents" element={<DocumentList/>} />
        <Route path="documents/document-details" element={<DocumentDetails/>} />
        <Route path="documents/document-details/read" element={<DocumentInfo/>} />
      </Route>
      <Route element={<ParentLayout />} path="/parent">
        <Route path="profile" element={<ParentProfile />} />
        <Route path="documents" element={<DocumentList/>} />
      </Route>
    </Routes>
  );
}

export default App;
