import { User, Hash, Github, GraduationCap, Crown } from 'lucide-react';

interface TeamMember {
    name: string;
    mssv: string;
    github: string;
    image: string;
    isLeader?: boolean;
}

const teamMembers: TeamMember[] = [
    {
        name: 'Nguyễn Ngọc Phú Tỷ',
        mssv: '49.01.104.172',
        github: 'tynnp',
        image: '/authors/NguyenNgocPhuTy.png',
        isLeader: true
    },
    {
        name: 'Cao Võ Tuấn Kiệt',
        mssv: '49.01.104.076',
        github: 'kietcvt',
        image: '/authors/CaoVoTuanKiet.png'
    },
    {
        name: 'Dương Thị Hoài Anh',
        mssv: '49.01.103.002',
        github: 'DuongThiHoaiAnh',
        image: '/authors/DuongThiHoaiAnh.jpg'
    },
    {
        name: 'Trần Lê Triều Dương',
        mssv: '49.01.104.026',
        github: 'TranLeTrieuDuong',
        image: '/authors/TranLeTrieuDuong.jpg'
    }
];

export default function AboutTeam() {
    return (
        <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Header - Compact */}
                <div className="px-4 py-3 text-center border-b">
                    <h1 className="text-lg md:text-xl font-bold text-[#124874]">
                        Giới thiệu nhóm tác giả
                    </h1>
                    <p className="text-gray-500 text-xs mt-0.5">
                        Đồ án Trí tuệ nhân tạo - Khoa Công nghệ Thông tin - Đại học Sư phạm TP. Hồ Chí Minh
                    </p>
                </div>

                {/* Team Grid */}
                <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {teamMembers.map((member, index) => (
                            <div
                                key={index}
                                className={`relative bg-gradient-to-b from-gray-50 to-white rounded-xl border-2 ${member.isLeader
                                    ? 'border-amber-400 shadow-lg shadow-amber-100'
                                    : 'border-gray-100 shadow-md'
                                    } overflow-hidden transition-transform hover:scale-105 hover:shadow-xl`}
                            >
                                {/* Leader Badge */}
                                {member.isLeader && (
                                    <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-400 to-amber-500 text-white px-1.5 py-0.5 rounded-bl-lg rounded-tr-xl text-[10px] font-semibold flex items-center gap-0.5 shadow-sm">
                                        <Crown className="w-2.5 h-2.5" />
                                        Leader
                                    </div>
                                )}

                                {/* Avatar */}
                                <div className="pt-6 pb-4 px-4 flex justify-center">
                                    <div className={`w-24 h-24 rounded-full overflow-hidden border-4 ${member.isLeader ? 'border-amber-400' : 'border-[#124874]'
                                        } shadow-lg`}>
                                        <img
                                            src={member.image}
                                            alt={member.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                                target.parentElement!.innerHTML = `
                                                    <div class="w-full h-full bg-gradient-to-br from-[#124874] to-[#0d3351] flex items-center justify-center">
                                                        <span class="text-white text-2xl font-bold">${member.name.charAt(0)}</span>
                                                    </div>
                                                `;
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="px-4 pb-5 text-center space-y-3">
                                    {/* Name */}
                                    <div className="flex items-center justify-center gap-1">
                                        <User className="w-3.5 h-3.5 text-[#124874] flex-shrink-0" />
                                        <span className="font-semibold text-gray-800 text-[0.8rem]">
                                            {member.name}
                                        </span>
                                    </div>

                                    {/* MSSV */}
                                    <div className="flex items-center justify-center gap-2">
                                        <Hash className="w-4 h-4 text-gray-500" />
                                        <span className="text-gray-600 text-sm font-mono">
                                            {member.mssv}
                                        </span>
                                    </div>

                                    {/* GitHub */}
                                    <a
                                        href={`https://github.com/${member.github}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded-full text-xs transition-colors"
                                    >
                                        <Github className="w-3.5 h-3.5" />
                                        <span>{member.github}</span>
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 border-t">
                    <p className="text-center text-gray-500 text-sm flex items-center justify-center gap-2">
                        <GraduationCap className="w-4 h-4" />
                        Năm học 2025 - 2026
                    </p>
                </div>
            </div>
        </div>
    );
}
