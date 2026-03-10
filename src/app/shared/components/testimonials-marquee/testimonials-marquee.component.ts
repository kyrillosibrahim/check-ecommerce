import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { TranslationService } from '../../../core/services/translation.service';

interface Review {
  name: string;
  nameAr: string;
  review: string;
  reviewAr: string;
  stars: number;
}

const REVIEWS: Review[] = [
  // --- Product authenticity ---
  { name: 'Ahmed Hassan', nameAr: 'أحمد حسن', review: 'Original products, 100% authentic. Highly recommend this store!', reviewAr: 'منتجات أصلية 100%، أنصح بالمتجر جداً!', stars: 5 },
  { name: 'Sara Mohamed', nameAr: 'سارة محمد', review: 'I was skeptical at first but the product is genuine and sealed.', reviewAr: 'كنت متشككة في الأول بس المنتج أصلي ومغلف.', stars: 5 },
  { name: 'Mahmoud Samir', nameAr: 'محمود سمير', review: 'Third time ordering, always original. Trusted store.', reviewAr: 'تالت مرة أطلب، دايماً أصلي. متجر موثوق.', stars: 5 },
  { name: 'Nourhan Ali', nameAr: 'نورهان علي', review: 'Checked the barcode, product is authentic. Very happy!', reviewAr: 'فحصت الباركود، المنتج أصلي. سعيدة جداً!', stars: 5 },
  // --- Fast delivery ---
  { name: 'Omar Khaled', nameAr: 'عمر خالد', review: 'Ordered yesterday, arrived today. Incredibly fast!', reviewAr: 'طلبت إمبارح ووصل النهارده. سرعة مذهلة!', stars: 5 },
  { name: 'Fatma Ibrahim', nameAr: 'فاطمة إبراهيم', review: 'Delivery was super fast, well-packaged and safe.', reviewAr: 'التوصيل سريع جداً، تغليف ممتاز وآمن.', stars: 5 },
  { name: 'Youssef Adel', nameAr: 'يوسف عادل', review: 'Got my order in less than 24 hours. Amazing service!', reviewAr: 'وصلني الطلب في أقل من 24 ساعة. خدمة ممتازة!', stars: 5 },
  // --- Quality & satisfaction ---
  { name: 'Mona Tarek', nameAr: 'منى طارق', review: 'Best quality I found online. Better than pharmacies!', reviewAr: 'أحسن جودة لقيتها أونلاين. أحسن من الصيدليات!', stars: 5 },
  { name: 'Hossam Magdy', nameAr: 'حسام مجدي', review: 'Excellent product, noticeable results from the first week.', reviewAr: 'منتج ممتاز، نتائج ملحوظة من أول أسبوع.', stars: 5 },
  { name: 'Dina Mostafa', nameAr: 'دينا مصطفى', review: 'Tried it for a month, amazing difference. Will order again.', reviewAr: 'جربته شهر، فرق رهيب. هطلب تاني.', stars: 5 },
  { name: 'Karim Essam', nameAr: 'كريم عصام', review: 'The product matched the description exactly. Very satisfied.', reviewAr: 'المنتج زي الوصف بالظبط. راضي جداً.', stars: 5 },
  // --- Trust & support ---
  { name: 'Rania Ashraf', nameAr: 'رانيا أشرف', review: 'Customer service responded instantly. Very professional team.', reviewAr: 'خدمة العملاء ردوا فوراً. فريق محترف جداً.', stars: 5 },
  { name: 'Hassan Wael', nameAr: 'حسن وائل', review: 'Secure payment, easy checkout. Site is very trustworthy.', reviewAr: 'دفع آمن وشراء سهل. الموقع موثوق جداً.', stars: 5 },
  { name: 'Laila Nabil', nameAr: 'ليلى نبيل', review: 'I recommend this store to everyone. Prices are fair and products are real.', reviewAr: 'بنصح كل الناس بالمتجر ده. أسعار عادلة ومنتجات حقيقية.', stars: 5 },
  // --- Repeat customers ---
  { name: 'Tamer Gamal', nameAr: 'تامر جمال', review: 'My 5th order! Always satisfied. Never disappointed.', reviewAr: 'خامس طلب ليّا! دايماً راضي. ما اتخيبتش أبداً.', stars: 5 },
  { name: 'Amira Sayed', nameAr: 'أميرة سيد', review: 'Became a regular customer. Quality never changes.', reviewAr: 'بقيت عميلة دائمة. الجودة ما بتتغيرش.', stars: 5 },
  { name: 'Mostafa Reda', nameAr: 'مصطفى رضا', review: 'Best online store in Egypt. Original and affordable.', reviewAr: 'أحسن متجر أونلاين في مصر. أصلي وبسعر كويس.', stars: 5 },
  { name: 'Noha Fathy', nameAr: 'نهى فتحي', review: 'Ordered for my family too. Everyone loved the products.', reviewAr: 'طلبت لعيلتي كمان. كلهم عجبهم المنتج.', stars: 5 },
  // --- More padding reviews ---
  { name: 'Khaled Saeed', nameAr: 'خالد سعيد', review: 'Packaging was perfect, product arrived in great condition.', reviewAr: 'التغليف كان ممتاز، المنتج وصل بحالة رائعة.', stars: 5 },
  { name: 'Mariam Hatem', nameAr: 'مريم حاتم', review: 'Genuine products at competitive prices. Love this store!', reviewAr: 'منتجات أصلية بأسعار منافسة. بحب المتجر ده!', stars: 4 },
];

@Component({
  selector: 'app-testimonials-marquee',
  imports: [],
  templateUrl: './testimonials-marquee.component.html',
  styleUrl: './testimonials-marquee.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestimonialsMarqueeComponent implements OnInit {
  translationService = inject(TranslationService);

  row1Cards: Review[] = [];
  row2Cards: Review[] = [];

  ngOnInit(): void {
    const shuffled = this.shuffle([...REVIEWS]);
    const mid = Math.ceil(shuffled.length / 2);
    this.row1Cards = shuffled.slice(0, mid);
    this.row2Cards = shuffled.slice(mid);
  }

  getName(r: Review): string {
    return this.translationService.isArabic() ? r.nameAr : r.name;
  }

  getReview(r: Review): string {
    return this.translationService.isArabic() ? r.reviewAr : r.review;
  }

  private readonly starCache = new Map<number, number[]>();

  getStars(r: Review): number[] {
    if (!this.starCache.has(r.stars)) {
      this.starCache.set(r.stars, Array(r.stars).fill(0));
    }
    return this.starCache.get(r.stars)!;
  }

  getEmptyStars(r: Review): number[] {
    const empty = 5 - r.stars;
    if (!this.starCache.has(-empty)) {
      this.starCache.set(-empty, Array(empty).fill(0));
    }
    return this.starCache.get(-empty)!;
  }

  private shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}
