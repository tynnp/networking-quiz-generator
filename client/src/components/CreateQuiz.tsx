import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Quiz } from '../types';
import { generateQuestions } from '../services/gemini';

const chapters = [
  'Chương 1 - Tổng quan về mạng máy tính',
  'Chương 2 - Tầng vật lý',
  'Chương 3 - Tầng liên kết dữ liệu',
  'Chương 4 - Tầng mạng',
  'Chương 5 - Tầng giao vận',
  'Chương 6 - Tầng ứng dụng',
  'Chương 7 - An toàn không gian mạng',
  'Chương 8 - Mạng không dây và di động'
];

const chapterTopics: { [chapter: string]: string[] } = {
  'Chương 1 - Tổng quan về mạng máy tính': [
    'Sự hình thành và phát triển mạng máy tính',
    'Các thành phần cơ bản (host, switch, router)',
    'Phân loại mạng (LAN, WAN, MAN, topology)',
    'Kiến trúc phân tầng (OSI, TCP/IP)'
  ],
  'Chương 2 - Tầng vật lý': [
    'Vai trò và chức năng tầng vật lý',
    'Môi trường truyền thông (dây đồng, cáp quang, không dây)',
    'Tín hiệu tương tự và số (điều chế, dồn kênh)',
    'Phương tiện truyền dẫn và tiêu chuẩn (UTP, fiber, EIA/TIA)'
  ],
  'Chương 3 - Tầng liên kết dữ liệu': [
    'Chức năng tầng liên kết dữ liệu',
    'Phát hiện và sửa lỗi (CRC, Hamming)',
    'Giao thức LAN (Ethernet, frame Ethernet)',
    'Chuyển mạch LAN (switch, VLAN, STP)'
  ],
  'Chương 4 - Tầng mạng': [
    'Khái niệm tầng mạng và mạch ảo/mạng gói',
    'Giao thức IP (IPv4/IPv6, địa chỉ IP, subnetting, VLSM, CIDR)',
    'Thuật toán định tuyến (RIP, OSPF, BGP)',
    'Định tuyến Internet (ICMP, NAT, DHCP)',
    'Định tuyến quảng bá và đa điểm'
  ],
  'Chương 5 - Tầng giao vận': [
    'Dịch vụ tầng giao vận (ghép kênh, giải ghép kênh)',
    'Giao thức UDP (kết nối không tin cậy)',
    'Giao thức TCP (sliding window, kiểm soát luồng/tắc nghẽn)',
    'Truyền tin cậy (ARQ, Go-Back-N)'
  ],
  'Chương 6 - Tầng ứng dụng': [
    'Mô hình ứng dụng (client-server, P2P)',
    'Web và HTTP/HTTPS',
    'Truyền file (FTP, TFTP)',
    'Thư điện tử (SMTP, POP3, IMAP)',
    'Phân giải tên miền (DNS)',
    'Các dịch vụ khác (Telnet, SNMP)'
  ],
  'Chương 7 - An toàn không gian mạng': [
    'Nguyên lý an toàn (CIA triad)',
    'Mối đe dọa và phòng thủ (DDoS, malware, firewall, IDS/IPS)',
    'An ninh IP, web và email (IPSec, TLS, email security)',
    'Quản trị mạng (Windows Server, Active Directory, GPO)',
    'Quản trị Linux (shell, quyền truy cập)',
    'Cấu hình dịch vụ (DHCP, DNS trên server)'
  ],
  'Chương 8 - Mạng không dây và di động': [
    'WLAN và Wi-Fi (chuẩn 802.11)',
    'Mạng di động (MANET, Mobile IP)',
    'Hệ thống GSM/4G/5G',
    'Mạng không dây băng rộng WiMAX',
    'Thách thức bảo mật và handover'
  ]
};

const knowledgeTypes = [
  { value: 'concept', label: 'Khái niệm' },
  { value: 'property', label: 'Tính chất' },
  { value: 'mechanism', label: 'Cơ chế hoạt động' },
  { value: 'rule', label: 'Quy tắc và tiêu chuẩn' },
  { value: 'scenario', label: 'Tình huống' },
  { value: 'example', label: 'Bài tập tính toán' }
];

const difficulties = [
  { value: 'easy', label: 'Dễ' },
  { value: 'medium', label: 'Trung bình' },
  { value: 'hard', label: 'Khó' }
];

export default function CreateQuiz() {
  const { addQuiz } = useData();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedKnowledgeTypes, setSelectedKnowledgeTypes] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [questionCount, setQuestionCount] = useState(10);
  const [duration, setDuration] = useState(30);
  const [generating, setGenerating] = useState(false);

  const handleGenerateQuiz = async () => {
    if (!title) {
      alert('Vui lòng nhập tiêu đề đề thi');
      return;
    }

    setGenerating(true);

    try {
      const questions = await generateQuestions({
        chapter: selectedChapter,
        topics: selectedTopics.length ? selectedTopics : undefined,
        knowledgeTypes: selectedKnowledgeTypes,
        difficulty: selectedDifficulty,
        count: questionCount
      });

      const newQuiz: Quiz = {
        id: `quiz-${Date.now()}`,
        title,
        description,
        questions,
        duration,
        createdBy: user?.id || '',
        createdAt: new Date(),
        settings: {
          chapter: selectedChapter,
          topic: selectedTopics[0] || '',
          knowledgeTypes: selectedKnowledgeTypes,
          difficulty: selectedDifficulty,
          questionCount
        }
      };

      addQuiz(newQuiz);
      alert('Tạo đề thành công!');
      resetForm();
    } catch (error) {
      alert('Có lỗi xảy ra khi tạo đề. Vui lòng thử lại.');
      console.error('Error creating quiz:', error);
    } finally {
      setGenerating(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSelectedChapter('');
    setSelectedTopics([]);
    setSelectedKnowledgeTypes([]);
    setSelectedDifficulty('');
    setQuestionCount(10);
    setDuration(30);
  };

  const availableTopics = selectedChapter ? (chapterTopics[selectedChapter] || []) : [];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-2">
        <h2 className="block-title__title">TẠO ĐỀ THI MỚI</h2>
      </div>
      <div className="bg-white rounded-xl shadow-md px-5 pt-3 pb-5">

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tiêu đề đề thi
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#124874] text-sm"
              placeholder="Ví dụ: Kiểm tra chương 1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#124874] text-sm"
              placeholder="Mô tả ngắn về đề thi"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chương
              </label>
              <select
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#124874] text-sm"
              >
                <option value="">Tất cả</option>
                {chapters.map(chapter => (
                  <option key={chapter} value={chapter}>{chapter}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Độ khó
              </label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#124874] text-sm"
              >
                <option value="">Tất cả</option>
                {difficulties.map(diff => (
                  <option key={diff.value} value={diff.value}>{diff.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chủ đề
              </label>
              <select
                multiple
                value={selectedTopics}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions, option => option.value);
                  setSelectedTopics(values);
                }}
                disabled={!selectedChapter}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#124874] text-sm disabled:bg-gray-100"
              >
                {availableTopics.map(topic => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phân loại kiến thức
              </label>
              <select
                multiple
                value={selectedKnowledgeTypes}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions, option => option.value);
                  setSelectedKnowledgeTypes(values);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#124874] text-sm"
              >
                {knowledgeTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số câu hỏi
              </label>
              <input
                type="number"
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                min="1"
                max="50"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#124874] text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thời gian (phút)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                min="5"
                max="180"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#124874] text-sm"
              />
            </div>
          </div>

          <button
            onClick={handleGenerateQuiz}
            disabled={generating}
            className="w-full bg-[#124874] text-white py-2 rounded-lg hover:bg-[#0d3351] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {generating ? 'Đang tạo đề...' : 'Tạo đề thi tự động'}
          </button>
        </div>
      </div>
    </div>
  );
}
