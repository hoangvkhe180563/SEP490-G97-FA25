import { useState, useMemo, useEffect } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  FileQuestion, BookOpen, GraduationCap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/common/components/ui/card';
import { useAuthStore } from '@/auth/stores/useAuthStore';
import { useLoading } from '@/common/hooks/useLoading';
import { QuestionService } from '@/exam/services/QuestionService';
import type { Subject } from '@/exam/interfaces/models/Subject';
import type { QuestionOverviewResponse } from '@/exam/interfaces/responses/QuestionOverviewResponse';
import type { QuestionDetailOverviewResponse } from '@/exam/interfaces/responses/QuestionDetailOverviewResponse';
import { ROLES } from '@/common/constants/Roles';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function Dashboard() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [overview, setOverview] = useState<QuestionOverviewResponse>();
  const [details, setDetails] = useState<QuestionDetailOverviewResponse[]>([]);
  const { user } = useAuthStore();
  const { setLoading } = useLoading();
  const questionService = new QuestionService();

  useEffect(() => {
    if (!user) {
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      if (user.roles.includes(ROLES.SCHOOL_ADMIN)) {
        const subjects = await questionService.getAllSubjects();
        setSubjects(subjects);
      } else {
        const subjects = await questionService.getManagerSubjects(user.id);
        setSubjects(subjects);
      }
      const overviewRes = await questionService.getQuestionDashboardOverview(user.id);
      setOverview(overviewRes);
      const detailRes = await questionService.getQuestionStatistics(user.id);
      setDetails(detailRes);
    }

    fetchData().catch(console.error).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const filteredQuestions = useMemo(() => {
    return details.filter(detail => {
      const matchSubject = detail.subjectId;
      const matchGrade = detail.grade;
      return matchSubject && matchGrade;
    });
  }, [details]);

  const typeStats = useMemo(() => {
    const counts: Record<string, number> = {};
    const mapping: Record<number, string> = {
      0: "Trắc nghiệm 1 đáp án",
      1: "Trắc nghiệm nhiều đáp án",
      2: "Điền từ",
      3: "Điền khuyết",
      4: "Nối cặp",
    };
    filteredQuestions.forEach(q => {
      counts[mapping[q.type]] = (counts[mapping[q.type]] || 0) + 1;
    });

    return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  }, [filteredQuestions]);

  const subjectStats = useMemo(() => {
    const counts: Record<string, number> = {};
    details.forEach(detail => {
      const subjectName = subjects.find(subject => subject.id === detail.subjectId)?.name ?? '';
      counts[subjectName] = (counts[subjectName] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredQuestions]);

  return (
    <div className="min-h-screen bg-slate-50/50 p-8 font-sans text-slate-900">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className='gap-3'>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng số câu hỏi</CardTitle>
            <FileQuestion className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.totalQuestions}</div>
            <p className="text-xs text-slate-500">câu hỏi</p>
          </CardContent>
        </Card>
        <Card className='gap-3'>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng số môn học</CardTitle>
            <BookOpen className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.totalSubjects}</div>
            <p className="text-xs text-slate-500">môn học đang quản lý</p>
          </CardContent>
        </Card>
        <Card className='gap-3'>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng số khối lớp có câu hỏi</CardTitle>
            <GraduationCap className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.totalGrades}</div>
            <p className="text-xs text-slate-500">khối</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mb-8">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Phân loại theo môn học</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectStats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar name="Số câu hỏi" dataKey="value" fill="#0f172a" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Phân theo loại câu hỏi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {typeStats.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}