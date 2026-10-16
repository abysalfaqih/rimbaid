import type { Metadata } from 'next'
import Link from 'next/link'
import {
  LegalPage,
  LegalTable,
  type LegalSectionData,
} from '@/components/public/legal-page'
import { YOUTUBE_URL } from '@/lib/constants/site'

export const metadata: Metadata = {
  title: 'Kebijakan Privasi',
  description: 'Penjelasan data apa saja yang diproses saat Anda memakai Rimba ID.',
}

const sections: LegalSectionData[] = [
  {
    id: 'ruang-lingkup',
    title: 'Ruang lingkup',
    body: (
      <>
        <p>
          Kebijakan Privasi ini menjelaskan bagaimana Rimba ID (“Kami”) memproses data saat Anda
          (“Anda”) mengakses situs kami dan mengunduh aplikasi yang tersedia di dalamnya.
        </p>
        <p>
          Kami berupaya mematuhi peraturan pelindungan data pribadi yang berlaku di Indonesia,
          termasuk Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi. Dokumen ini
          berlaku bersama <Link href="/terms">Syarat & Ketentuan</Link> kami.
        </p>
      </>
    ),
  },
  {
    id: 'data-diproses',
    title: 'Data yang kami proses',
    body: (
      <>
        <p>
          Kami tidak meminta Anda membuat akun dan tidak meminta nama atau email untuk mengunduh
          aplikasi. Meski begitu, beberapa data teknis tetap diproses agar layanan berjalan dengan
          aman:
        </p>
        <LegalTable
          head={['Jenis data', 'Contoh', 'Tujuan', 'Penyimpanan']}
          rows={[
            [
              'Statistik penggunaan',
              'Halaman aplikasi dilihat, unduhan diselesaikan (tanpa nama atau email)',
              'Mengetahui aplikasi yang diminati',
              'Selama diperlukan untuk statistik',
            ],
            [
              'Sesi verifikasi unduhan',
              'Pengenal sesi, kemajuan langkah, waktu',
              'Menjalankan dan memeriksa verifikasi di server',
              'Paling lama 30 menit, lalu dibersihkan berkala',
            ],
            [
              'Data keamanan',
              'Alamat IP dan waktu permintaan',
              'Membatasi permintaan berlebihan dan mencegah penyalahgunaan',
              'Sementara',
            ],
            [
              'Log hosting',
              'Alamat IP, jenis peramban, waktu akses',
              'Operasional dan keamanan infrastruktur',
              'Sesuai kebijakan penyedia hosting',
            ],
            [
              'Akun pengelola',
              'Email dan sesi login (khusus pengelola situs)',
              'Mengamankan area pengelola',
              'Selama akun aktif',
            ],
          ]}
        />
      </>
    ),
  },
  {
    id: 'tidak-dikumpulkan',
    title: 'Data yang tidak kami kumpulkan',
    body: (
      <>
        <p>Dari pengunjung, kami tidak mengumpulkan:</p>
        <ul>
          <li>nama, alamat email, atau nomor telepon;</li>
          <li>lokasi yang presisi;</li>
          <li>data pembayaran atau data keuangan;</li>
          <li>isi berkas atau data pribadi lain di perangkat Anda.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'tujuan',
    title: 'Tujuan pemrosesan',
    body: (
      <>
        <p>Data di atas kami gunakan semata-mata untuk:</p>
        <ul>
          <li>menyediakan dan mengamankan layanan unduhan;</li>
          <li>mencegah penyalahgunaan, serangan, dan permintaan yang tidak wajar;</li>
          <li>memahami aplikasi mana yang berguna sebagai bahan pengembangan berikutnya.</li>
        </ul>
        <p>Kami tidak menjual data Anda dan tidak memakainya untuk iklan.</p>
      </>
    ),
  },
  {
    id: 'cookie',
    title: 'Cookie dan penyimpanan lokal',
    body: (
      <>
        <p>
          Kami tidak memakai cookie iklan atau pelacak pihak ketiga. Penyimpanan di peramban Anda
          terbatas pada:
        </p>
        <LegalTable
          head={['Nama', 'Fungsi', 'Durasi']}
          rows={[
            [
              'Preferensi tema',
              'Mengingat pilihan tampilan terang atau gelap (penyimpanan lokal peramban)',
              'Sampai Anda menghapusnya',
            ],
            [
              'Sesi verifikasi unduhan',
              'Pengenal sesi sementara untuk proses unduhan',
              'Paling lama 30 menit',
            ],
            [
              'Sesi login pengelola',
              'Otentikasi, hanya digunakan oleh pengelola situs',
              'Selama sesi login',
            ],
          ]}
        />
        <p>Anda dapat menghapus penyimpanan ini kapan saja melalui pengaturan peramban Anda.</p>
      </>
    ),
  },
  {
    id: 'pembagian-data',
    title: 'Pembagian data dan penyedia layanan',
    body: (
      <>
        <p>
          Kami tidak membagikan data Anda kepada pihak lain kecuali kepada penyedia infrastruktur
          yang diperlukan agar situs berjalan:
        </p>
        <ul>
          <li>
            <strong>Vercel</strong> untuk hosting dan pengiriman halaman situs;
          </li>
          <li>
            <strong>Supabase</strong> untuk basis data dan penyimpanan berkas.
          </li>
        </ul>
        <p>
          Data juga dapat kami ungkapkan apabila diwajibkan oleh hukum atau permintaan resmi dari
          otoritas yang berwenang.
        </p>
      </>
    ),
  },
  {
    id: 'transfer',
    title: 'Transfer data lintas negara',
    body: (
      <p>
        Server penyedia layanan di atas dapat berada di luar Indonesia, sehingga data Anda dapat
        diproses di negara lain. Kami memilih penyedia yang menerapkan standar keamanan yang wajar
        untuk melindungi data tersebut.
      </p>
    ),
  },
  {
    id: 'keamanan',
    title: 'Keamanan data',
    body: (
      <>
        <p>Kami menerapkan langkah-langkah perlindungan, antara lain:</p>
        <ul>
          <li>koneksi terenkripsi (HTTPS) untuk seluruh akses ke situs;</li>
          <li>pembatasan akses ke basis data sehingga data internal tidak terbuka untuk umum;</li>
          <li>pemeriksaan verifikasi unduhan dan pembatasan permintaan di sisi server;</li>
          <li>area pengelola yang dilindungi autentikasi.</li>
        </ul>
        <p>
          Meski demikian, tidak ada sistem yang sepenuhnya bebas risiko, dan kami tidak dapat
          menjamin keamanan mutlak.
        </p>
      </>
    ),
  },
  {
    id: 'penyimpanan',
    title: 'Jangka waktu penyimpanan',
    body: (
      <p>
        Kami menyimpan data hanya selama diperlukan untuk tujuan yang dijelaskan di atas. Sesi
        verifikasi yang telah kedaluwarsa dibersihkan secara berkala, dan data teknis keamanan
        disimpan sementara. Statistik penggunaan yang tidak memuat identitas pribadi dapat
        disimpan lebih lama untuk keperluan analisis.
      </p>
    ),
  },
  {
    id: 'hak-anda',
    title: 'Hak Anda',
    body: (
      <>
        <p>Sesuai peraturan yang berlaku, Anda dapat meminta untuk:</p>
        <ul>
          <li>mengetahui data pribadi Anda yang kami proses;</li>
          <li>memperbaiki data yang tidak akurat;</li>
          <li>menghapus atau menghentikan pemrosesan data Anda;</li>
          <li>mengajukan keberatan atas pemrosesan tertentu.</li>
        </ul>
        <p>
          Karena kami tidak menyimpan data yang mengidentifikasi Anda secara langsung, kami mungkin
          memerlukan informasi tambahan untuk menemukan data yang Anda maksud. Ajukan permintaan
          Anda melalui kontak di bagian bawah dokumen ini.
        </p>
      </>
    ),
  },
  {
    id: 'anak',
    title: 'Anak di bawah umur',
    body: (
      <p>
        Situs ini tidak ditujukan untuk mengumpulkan data pribadi dari anak secara sengaja. Jika
        Anda orang tua atau wali dan menduga anak Anda memberikan data pribadi kepada kami,
        hubungi kami agar data tersebut dapat kami tinjau dan hapus.
      </p>
    ),
  },
  {
    id: 'tautan-eksternal',
    title: 'Tautan eksternal',
    body: (
      <p>
        Tombol unduh dan tautan sosial media dapat membawa Anda ke situs lain, seperti layanan
        penyimpanan berkas atau YouTube. Kebijakan privasi situs tersebut yang berlaku di sana,
        bukan Kebijakan Privasi ini.
      </p>
    ),
  },
  {
    id: 'perubahan',
    title: 'Perubahan kebijakan',
    body: (
      <p>
        Kami dapat memperbarui Kebijakan Privasi ini sewaktu-waktu. Versi terbaru selalu tersedia
        di halaman ini, lengkap dengan tanggal berlaku dan nomor versi di bagian atas. Untuk
        perubahan yang penting, kami akan menampilkan pemberitahuan di situs.
      </p>
    ),
  },
  {
    id: 'kontak',
    title: 'Kontak',
    body: (
      <p>
        Pertanyaan, permintaan, atau keluhan terkait Kebijakan Privasi ini dapat disampaikan
        melalui{' '}
        <a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer">
          YouTube Rimba ID
        </a>
        . Kami berupaya menanggapi dalam waktu yang wajar.
      </p>
    ),
  },
]

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Kebijakan Privasi"
      summary="Rimba ID tidak meminta akun, nama, atau email untuk mengunduh aplikasi. Yang kami proses hanya data teknis seperlunya: statistik penggunaan tanpa identitas, sesi verifikasi sementara, dan data keamanan untuk mencegah penyalahgunaan. Data tidak dijual dan tidak dipakai untuk iklan."
      sections={sections}
      related={{ href: '/terms', label: 'Syarat & Ketentuan' }}
    />
  )
}