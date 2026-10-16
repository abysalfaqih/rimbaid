import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalPage, type LegalSectionData } from '@/components/public/legal-page'
import { YOUTUBE_URL } from '@/lib/constants/site'

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan',
  description: 'Aturan penggunaan situs dan aplikasi yang tersedia di Rimba ID.',
}

const sections: LegalSectionData[] = [
  {
    id: 'penerimaan',
    title: 'Penerimaan syarat',
    body: (
      <>
        <p>
          Dokumen ini mengatur penggunaan situs Rimba ID (“Situs”) dan aplikasi yang dibagikan
          melalui Situs (“Aplikasi”). “Kami” berarti pengelola Rimba ID, dan “Anda” berarti setiap
          orang yang mengakses Situs atau mengunduh Aplikasi.
        </p>
        <p>
          Dengan mengakses Situs atau mengunduh Aplikasi, Anda menyatakan telah membaca dan
          menyetujui Syarat & Ketentuan ini serta <Link href="/privacy">Kebijakan Privasi</Link>{' '}
          kami. Jika Anda tidak setuju, mohon hentikan penggunaan Situs.
        </p>
      </>
    ),
  },
  {
    id: 'layanan',
    title: 'Tentang layanan',
    body: (
      <p>
        Rimba ID adalah situs untuk membagikan aplikasi yang dibuat dan dikelola oleh pemilik
        Situs. Kami dapat menambah, mengubah, atau menghapus Aplikasi dan fitur kapan saja, dengan
        atau tanpa pemberitahuan sebelumnya.
      </p>
    ),
  },
  {
    id: 'kelayakan',
    title: 'Kelayakan penggunaan',
    body: (
      <>
        <p>
          Situs ini dapat diakses oleh siapa saja. Jika Anda belum dewasa menurut hukum yang
          berlaku, gunakan Situs dan Aplikasi dengan sepengetahuan dan pendampingan orang tua atau
          wali.
        </p>
        <p>
          Anda menyatakan berhak secara hukum untuk memasang dan menggunakan Aplikasi di perangkat
          Anda.
        </p>
      </>
    ),
  },
  {
    id: 'unduhan',
    title: 'Proses unduhan dan verifikasi',
    body: (
      <>
        <p>
          Untuk mengunduh Aplikasi, Anda perlu menyelesaikan verifikasi beberapa langkah. Verifikasi
          ini dijalankan dan diperiksa di server kami, dan tautan unduhan hanya diberikan setelah
          seluruh langkah selesai sebagaimana mestinya.
        </p>
        <p>
          Sesi verifikasi bersifat sementara, hanya dapat dipakai satu kali, dan akan kedaluwarsa
          dalam waktu singkat. Jika sesi kedaluwarsa, Anda perlu memulai verifikasi dari awal.
        </p>
      </>
    ),
  },
  {
    id: 'larangan',
    title: 'Perilaku yang dilarang',
    body: (
      <>
        <p>Saat menggunakan Situs, Anda tidak diperbolehkan untuk:</p>
        <ul>
          <li>melewati, memanipulasi, atau mengotomatisasi proses verifikasi unduhan;</li>
          <li>
            mengambil tautan unduhan atau data Situs secara massal (scraping), atau membagikan ulang
            sesi unduhan;
          </li>
          <li>mengirim permintaan berlebihan yang dapat membebani atau mengganggu layanan;</li>
          <li>
            mencoba mengakses area pengelola, basis data, atau sistem yang tidak diperuntukkan bagi
            Anda;
          </li>
          <li>
            menyalahgunakan Situs untuk menyebarkan perangkat lunak berbahaya atau melanggar hukum.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'aplikasi',
    title: 'Penggunaan Aplikasi dan penafian jaminan',
    body: (
      <>
        <p>
          Aplikasi disediakan “sebagaimana adanya” dan “sebagaimana tersedia”, tanpa jaminan dalam
          bentuk apa pun, baik tersurat maupun tersirat, termasuk jaminan bebas dari kesalahan atau
          kecocokan untuk tujuan tertentu.
        </p>
        <p>
          Anda bertanggung jawab atas perangkat dan data Anda. Kami menyarankan mencadangkan data
          sebelum memasang Aplikasi apa pun, dan hanya mengunduh Aplikasi dari Situs ini. Kami tidak
          bertanggung jawab atas berkas dari sumber lain yang mengatasnamakan Rimba ID.
        </p>
      </>
    ),
  },
  {
    id: 'kekayaan-intelektual',
    title: 'Hak kekayaan intelektual',
    body: (
      <>
        <p>
          Aplikasi, logo, nama, desain, dan konten di Situs ini adalah milik Rimba ID, kecuali
          dinyatakan lain, dan dilindungi oleh peraturan hak kekayaan intelektual yang berlaku.
        </p>
        <p>
          Anda boleh menggunakan Aplikasi untuk keperluan pribadi. Tanpa izin tertulis dari kami,
          Anda tidak boleh menjual, menyewakan, menyebarkan ulang, memodifikasi lalu mengklaimnya
          sebagai karya sendiri, atau menghapus identitas pembuatnya.
        </p>
      </>
    ),
  },
  {
    id: 'pihak-ketiga',
    title: 'Tautan dan layanan pihak ketiga',
    body: (
      <p>
        Tombol unduh dapat mengarah ke layanan penyimpanan berkas milik pihak ketiga, dan Situs
        dapat memuat tautan ke situs lain. Kami tidak mengendalikan serta tidak bertanggung jawab
        atas isi, kebijakan, maupun ketersediaan layanan tersebut. Penggunaan layanan itu tunduk
        pada ketentuan masing-masing penyedianya.
      </p>
    ),
  },
  {
    id: 'ketersediaan',
    title: 'Ketersediaan layanan',
    body: (
      <p>
        Kami berupaya menjaga Situs tetap dapat diakses, tetapi tidak menjamin layanan akan selalu
        tersedia, bebas gangguan, atau bebas kesalahan. Pemeliharaan, pembaruan, atau gangguan di
        luar kendali kami, termasuk gangguan dari penyedia infrastruktur, dapat menyebabkan Situs
        atau tautan unduhan sementara tidak dapat diakses.
      </p>
    ),
  },
  {
    id: 'batasan-tanggung-jawab',
    title: 'Batasan tanggung jawab',
    body: (
      <>
        <p>
          Sejauh diizinkan oleh hukum, Rimba ID tidak bertanggung jawab atas kerugian langsung
          maupun tidak langsung, termasuk kehilangan data, kerusakan perangkat, hilangnya
          keuntungan, atau gangguan layanan, yang timbul dari penggunaan atau ketidakmampuan
          menggunakan Situs maupun Aplikasi.
        </p>
        <p>
          Tidak ada ketentuan dalam dokumen ini yang meniadakan hak Anda yang dijamin oleh
          peraturan perundang-undangan yang berlaku.
        </p>
      </>
    ),
  },
  {
    id: 'penangguhan',
    title: 'Penangguhan dan pemutusan akses',
    body: (
      <p>
        Kami berhak membatasi, menangguhkan, atau memblokir akses ke Situs, tanpa pemberitahuan
        sebelumnya, apabila kami menduga terjadi pelanggaran terhadap Syarat & Ketentuan ini atau
        penyalahgunaan yang membahayakan Situs maupun pengguna lain.
      </p>
    ),
  },
  {
    id: 'perubahan',
    title: 'Perubahan syarat',
    body: (
      <p>
        Kami dapat memperbarui Syarat & Ketentuan ini sewaktu-waktu. Versi terbaru selalu tersedia
        di halaman ini, lengkap dengan tanggal berlaku dan nomor versi di bagian atas. Dengan
        terus menggunakan Situs setelah pembaruan, Anda dianggap menerima perubahan tersebut.
      </p>
    ),
  },
  {
    id: 'ketentuan-umum',
    title: 'Ketentuan umum',
    body: (
      <ul>
        <li>
          Syarat & Ketentuan ini tunduk pada hukum yang berlaku di Republik Indonesia.
        </li>
        <li>
          Apabila timbul perselisihan, kedua pihak akan mengupayakan penyelesaian secara musyawarah
          terlebih dahulu sebelum menempuh jalur hukum yang berlaku.
        </li>
        <li>
          Jika ada ketentuan yang dinyatakan tidak sah atau tidak dapat dilaksanakan, ketentuan
          lainnya tetap berlaku.
        </li>
      </ul>
    ),
  },
  {
    id: 'kontak',
    title: 'Kontak',
    body: (
      <p>
        Pertanyaan mengenai Syarat & Ketentuan ini dapat disampaikan melalui{' '}
        <a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer">
          YouTube Rimba ID
        </a>
        . Kami berupaya menanggapi dalam waktu yang wajar.
      </p>
    ),
  },
]

export default function TermsPage() {
  return (
    <LegalPage
      title="Syarat & Ketentuan"
      summary="Dengan memakai Rimba ID, Anda setuju mengikuti aturan berikut. Intinya: Aplikasi disediakan apa adanya, proses verifikasi unduhan tidak boleh dilewati atau diotomatisasi, dan seluruh karya di Situs ini tetap milik Rimba ID."
      sections={sections}
      related={{ href: '/privacy', label: 'Kebijakan Privasi' }}
    />
  )
}