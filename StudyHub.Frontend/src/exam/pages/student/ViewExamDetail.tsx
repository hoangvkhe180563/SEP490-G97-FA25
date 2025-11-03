import { useParams } from "react-router-dom"

const ViewExamDetail = () => {
  const { id } = useParams();
  return (
    <div>
      <a
        href={`/exam/student/take-exam/${id}`}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
      >
        Bắt đầu làm bài
      </a>
    </div>
  )
}

export default ViewExamDetail