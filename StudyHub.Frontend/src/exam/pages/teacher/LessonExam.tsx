import { useParams } from 'react-router-dom'

const LessonExam = () => {
  const { id } = useParams();

  return (
    <div>LessonExam: {id}</div>
  )
}

export default LessonExam