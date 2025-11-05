import type { Exam } from "../interfaces/models/Exam"
import type { ExamResult } from "../interfaces/models/ExamResult"

export const MOCK_DATA_USERS = [
  {
    id: 1,
    username: "teacher1",
    password: "1",
    role: "teacher"
  },
  {
    id: 2,
    username: "student1",
    password: "2",
    role: "student"
  },
  {
    id: 3,
    username: "student2",
    password: "3",
    role: "student"
  },
  {
    id: 4,
    username: "teacher2",
    password: "4",
    role: "teacher"
  }
]

export const MOCK_DATA_EXAMS: Exam[] = [
  {
    id: 1,
    title: "test 2",
    description: "description 2",
    duration: 2,
    createdBy: 1,
    questions: [
      {
        id: 1,
        questionText: "cau hoi 2 - 1",
        type: "single-choice",
        options: [
          "lua chon sai 1",
          "lua chon sai 2",
          "lua chon dung",
          "lua chon sai 3"
        ],
        correctAnswer: 2
      },
      {
        id: 2,
        questionText: "cau hoi 2 - 2",
        type: "multiple-choice",
        options: [
          "lua chon dung 1",
          "lua chon sai 1",
          "lua chon dung 2",
          "lua chon sai 2"
        ],
        correctAnswer: [
          0, 2
        ]
      },
      {
        id: 3,
        questionText: "Thành là gì?",
        type: "text-input",
        options: [],
        correctAnswer: "Súc Vật"
      }
    ],
    showAnswers: true,
    showCorrectAnswers: true,
    openTime: new Date('2025-11-04T13:00:00Z')
  },
  {
    title: "dwdwdwdw",
    description: "sadd1",
    duration: 2,
    createdBy: 1,
    questions: [
      {
        id: 1,
        questionText: "dap an ahihihihi",
        type: "single-choice",
        options: [
          "dsasdsadasd",
          "aasa",
          "asas",
          "dssd"
        ],
        correctAnswer: 1
      },
      {
        id: 2,
        questionText: "misa asim",
        type: "multiple-choice",
        options: [
          "ddas",
          "sdd",
          "cors",
          "cors2"
        ],
        correctAnswer: [
          2, 3
        ]
      }
    ],
    id: 2,
    showAnswers: true,
    showCorrectAnswers: true,
    openTime: new Date('2025-11-04T13:00:00Z')
  },
  {
    id: 3,
    title: "Thồn Lành Test 123",
    description: "What the? I need it on my desk now!",
    duration: 5,
    createdBy: 4,
    questions: [
      {
        id: 1,
        questionText: "Question 1 - Take 2",
        type: "single-choice",
        options: [
          "Answer 10",
          "Answer 20",
          "Answer 30"
        ],
        correctAnswer: 0
      },
      {
        id: 2,
        questionText: "Question 2 - Take 2",
        type: "single-choice",
        options: [
          "Answer 10",
          "Answer 20",
          "Answer 30"
        ],
        correctAnswer: 2
      },
      {
        id: 3,
        questionText: "Thồn lành có súc vật không",
        type: "multiple-choice",
        options: [
          "Có súc vật",
          "Quá súc vật"
        ],
        correctAnswer: [
          "Quá súc vật",
          "Có súc vật"
        ]
      }
    ],
    showAnswers: true,
    showCorrectAnswers: true,
    openTime: new Date('2025-11-04T13:00:00Z')
  },
  {
    title: "Bài kiểm tra số 2",
    description: "the 2nd test",
    duration: 1,
    createdBy: 1,
    questions: [
      {
        id: 1,
        questionText: "Thành có Súc Vật không",
        type: "single-choice",
        options: [
          "Có",
          "Không"
        ],
        correctAnswer: 0
      },
      {
        id: 2,
        questionText: "Đặc điểm xấu của Thành là gì",
        type: "multiple-choice",
        options: [
          "Hay chơi điện tử",
          "Hay kêu như khỉ",
          "Hay chạy bộ sáng sớm",
          "Lông lá khi tắm"
        ],
        correctAnswer: [
          0, 1, 3
        ]
      },
      {
        id: 3,
        questionText: "BĐCTR",
        type: "text-input",
        correctAnswer: "Bị đình chỉ thi rồi",
        options: []
      }
    ],
    id: 4,
    showAnswers: true,
    showCorrectAnswers: true,
    openTime: new Date('2025-11-04T13:00:00Z'),
    closeTime: new Date('2025-11-05T00:00:00Z')
  },
  {
    title: "Các từ viết tắt của Thành",
    description: "Mô tả các từ viết tắt",
    duration: 2,
    createdBy: 1,
    questions: [
      {
        id: 1,
        questionText: "HHHH",
        type: "text-input",
        correctAnswer: "hú hú há há",
        options: []
      },
      {
        id: 2,
        questionText: "THTVTCH",
        type: "text-input",
        correctAnswer: "Tiện hơn tí vẫn thích chatgpt hơn",
        options: []
      },
      {
        id: 3,
        questionText: "BĐCTR",
        type: "text-input",
        correctAnswer: "Bị đình chỉ thi rồi",
        options: []
      },
      {
        id: 4,
        questionText: "MGCG",
        type: "text-input",
        correctAnswer: "mẹ giục cái gì",
        options: []
      },
      {
        id: 5,
        questionText: "ĐBTGNGSƠ",
        type: "text-input",
        correctAnswer: "đừng bơ thằng grab này giáo sư ơi",
        options: []
      }
    ],
    id: 5,
    showAnswers: true,
    showCorrectAnswers: true,
    openTime: new Date('2025-11-04T13:00:00Z')
  },
  {
    title: "bai kiem tra so 10",
    description: "10 exam",
    duration: 10,
    createdBy: 1,
    questions: [
      {
        id: 1,
        questionText: "Câu hỏi có [BLANK] thứ nhất và [BLANK] thứ hai.",
        type: "fill-blank",
        options: [],
        correctAnswer: [
          "option1",
          "option2"
        ]
      },
      {
        id: 2,
        questionText: "finally",
        type: "single-choice",
        options: [
          "end",
          "haha"
        ],
        correctAnswer: 0
      }
    ],
    id: 6,
    showAnswers: true,
    showCorrectAnswers: false,
    openTime: new Date('2025-11-04T13:00:00Z')
  },
  {
    title: "Lịch sử Đảng CSVN",
    description: "Bài kiểm tra REAL",
    duration: 1,
    createdBy: 4,
    questions: [
      {
        id: 1,
        questionText: "Phương châm của chiến dịch Hồ Chí Minh là: [BLANK],  [BLANK],  [BLANK],  [BLANK].",
        type: "fill-blank",
        options: [],
        correctAnswer: [
          "thần tốc",
          "táo bạo",
          "bất ngờ",
          "chắc thắng"
        ]
      },
      {
        id: 2,
        questionText: "Bác Hồ tên thật là gì?",
        type: "text-input",
        options: [],
        correctAnswer: "Hồ Chí Minh"
      }
    ],
    id: 7,
    showAnswers: true,
    showCorrectAnswers: false,
    openTime: new Date('2025-11-04T13:00:00Z')
  },
  {
    title: "Bài kiểm tra xem Thành có Súc Vật hay không",
    description: "hãy cho biết các từ viết tắt trong tất cả các câu hỏi",
    duration: 10,
    createdBy: 1,
    questions: [
      {
        id: 1,
        questionText: "BĐCTR",
        type: "text-input",
        options: [],
        correctAnswer: "Bị đình chỉ thi rồi"
      },
      {
        id: 2,
        questionText: "HHHH",
        type: "text-input",
        options: [],
        correctAnswer: "hú hú há há"
      },
      {
        id: 3,
        questionText: "MGCG",
        type: "text-input",
        options: [],
        correctAnswer: "mẹ giục cái gì"
      },
      {
        id: 4,
        questionText: "THTVTCH",
        type: "text-input",
        options: [],
        correctAnswer: "tiện hơn tí vẫn thích chatgpt hơn"
      }
    ],
    id: 8,
    showAnswers: true,
    showCorrectAnswers: false,
    openTime: new Date('2025-11-04T13:00:00Z')
  }
]

export const MOCK_DATA_RESULTS: ExamResult[] = [
  {
    examId: 1,
    studentId: 2,
    submissionTime: new Date("2025-11-01T05:14:31.984Z"),
    score: 2,
    totalQuestions: 3,
    answers: [
      {
        questionId: 1,
        studentAnswer: "lua chon dung",
        isCorrect: true
      },
      {
        questionId: 2,
        studentAnswer: [
          "lua chon dung 1",
          "lua chon dung 2"
        ],
        isCorrect: true
      },
      {
        questionId: 3,
        studentAnswer: "sv",
        isCorrect: false
      }
    ],
    id: 1,
    cheatTimes: 1
  }
]