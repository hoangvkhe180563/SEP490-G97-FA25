interface ILessonExamProps {
  lessonId: number
}

const LessonExam = (props: ILessonExamProps) => {
  return (
    <div>
      <div>Your lesson id is: {props.lessonId}.</div>
      <div>TODO: fetch exam info of this lesson (Hoang will do this)</div>
    </div>
  )
}

export default LessonExam