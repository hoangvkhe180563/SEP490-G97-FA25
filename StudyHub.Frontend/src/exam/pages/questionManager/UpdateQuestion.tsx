import { useParams } from "react-router-dom"

const UpdateQuestion = () => {
  const { id } = useParams();
  return (
    <div>UpdateQuestion {id}</div>
  )
}

export default UpdateQuestion