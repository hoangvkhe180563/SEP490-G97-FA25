export function getQuestionType(type: number) {
  const labels: Record<number, string> = {
    0: "Trắc nghiệm 1 đ.án",
    1: "Trắc nghiệm nhiều đ.án",
    2: "Điền từ",
    3: "Điền khuyết",
    4: "Nối"
  };

  return labels[type];
}