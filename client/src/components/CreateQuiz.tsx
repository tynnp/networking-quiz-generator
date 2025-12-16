import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
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
  const { showToast } = useToast();
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
      showToast('Vui lòng nhập tiêu đề đề thi', 'warning');
      return;
    }

    if (questionCount < 1 || questionCount > 30) {
      showToast('Số câu hỏi phải từ 1 đến 30', 'warning');
      return;
    }

    if (duration < 1 || duration > 600) {
      showToast('Thời gian phải từ 1 đến 600 phút', 'warning');
      return;
    }

    if (!selectedChapter) {
      showToast('Vui lòng chọn chương', 'warning');
      return;
    }

    if (selectedTopics.length === 0) {
      showToast('Vui lòng chọn ít nhất một chủ đề', 'warning');
      return;
    }

    if (selectedKnowledgeTypes.length === 0) {
      showToast('Vui lòng chọn ít nhất một phân loại kiến thức', 'warning');
      return;
    }

    setGenerating(true);

    try {
      const questions = await generateQuestions({
        chapter: selectedChapter,
        topics: selectedTopics,
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

      await addQuiz(newQuiz);
      showToast('Tạo đề thành công!', 'success');
      resetForm();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Có lỗi xảy ra khi tạo đề. Vui lòng thử lại.',
        'error'
      );
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tiêu đề đề thi *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#124874] text-sm"
                placeholder="Ví dụ: Kiểm tra chương 1"
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thời gian (phút)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (value >= 1 && value <= 600) {
                    setDuration(value);
                  } else if (value > 600) {
                    setDuration(600);
                  } else if (value < 1 && e.target.value !== '') {
                    setDuration(1);
                  }
                }}
                onBlur={(e) => {
                  const value = Number(e.target.value);
                  if (value < 1 || isNaN(value)) {
                    setDuration(1);
                  } else if (value > 600) {
                    setDuration(600);
                  }
                }}
                min="1"
                max="600"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#124874] text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">Từ 1 đến 600 phút</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                maxLength={150}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số câu hỏi
              </label>
              <input
                type="number"
                value={questionCount}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (value >= 1 && value <= 30) {
                    setQuestionCount(value);
                  } else if (value > 30) {
                    setQuestionCount(30);
                  } else if (value < 1 && e.target.value !== '') {
                    setQuestionCount(1);
                  }
                }}
                onBlur={(e) => {
                  const value = Number(e.target.value);
                  if (value < 1 || isNaN(value)) {
                    setQuestionCount(1);
                  } else if (value > 30) {
                    setQuestionCount(30);
                  }
                }}
                min="1"
                max="30"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#124874] text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">Từ 1 đến 30 câu hỏi</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chương *
              </label>
              <select
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#124874] text-sm"
              >
                <option value="">Chọn chương</option>
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
                <option value="">Hỗn hợp</option>
                {difficulties.map(diff => (
                  <option key={diff.value} value={diff.value}>{diff.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chủ đề *
              </label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-lg max-h-48 overflow-y-auto bg-white">
                {availableTopics.length > 0 ? (
                  availableTopics.map(topic => (
                    <div key={topic} className="flex items-start mb-2 last:mb-0">
                      <input
                        type="checkbox"
                        id={`topic-${topic}`}
                        value={topic}
                        checked={selectedTopics.includes(topic)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTopics([...selectedTopics, topic]);
                          } else {
                            setSelectedTopics(selectedTopics.filter(t => t !== topic));
                          }
                        }}
                        className="mt-1 w-4 h-4 text-[#124874] border-gray-300 rounded focus:ring-[#124874]"
                      />
                      <label htmlFor={`topic-${topic}`} className="ml-2 text-sm text-gray-700 cursor-pointer select-none">
                        {topic}
                      </label>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 italic">Vui lòng chọn chương trước</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phân loại kiến thức *
              </label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-lg max-h-48 overflow-y-auto bg-white">
                {knowledgeTypes.map(type => (
                  <div key={type.value} className="flex items-center mb-2 last:mb-0">
                    <input
                      type="checkbox"
                      id={`type-${type.value}`}
                      value={type.value}
                      checked={selectedKnowledgeTypes.includes(type.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedKnowledgeTypes([...selectedKnowledgeTypes, type.value]);
                        } else {
                          setSelectedKnowledgeTypes(selectedKnowledgeTypes.filter(t => t !== type.value));
                        }
                      }}
                      className="w-4 h-4 text-[#124874] border-gray-300 rounded focus:ring-[#124874]"
                    />
                    <label htmlFor={`type-${type.value}`} className="ml-2 text-sm text-gray-700 cursor-pointer select-none">
                      {type.label}
                    </label>
                  </div>
                ))}
              </div>
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
