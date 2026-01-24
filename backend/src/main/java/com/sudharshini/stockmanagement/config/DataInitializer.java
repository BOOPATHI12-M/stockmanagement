package com.sudharshini.stockmanagement.config;

import com.sudharshini.stockmanagement.entity.Product;
import com.sudharshini.stockmanagement.repository.ProductRepository;
import com.sudharshini.stockmanagement.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Data Initializer
 * Creates default admin user if it doesn't exist
 */
@Component
public class DataInitializer implements CommandLineRunner {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ProductRepository productRepository;
    
    @PersistenceContext
    private EntityManager entityManager;
    
    @Override
    @Transactional
    public void run(String... args) throws Exception {
        System.out.println("🚀 Starting DataInitializer...");
        
        // Migrate database schema to support DELIVERY_MAN role
        try {
            migrateDatabaseSchema();
        } catch (Exception e) {
            System.err.println("⚠️  Migration failed but continuing: " + e.getMessage());
            // Continue anyway - we'll handle errors when creating delivery man
        }
        
        // Migrate orders table to support ACCEPTED and PICKED_UP statuses
        try {
            migrateOrdersTableSchema();
        } catch (Exception e) {
            System.err.println("⚠️  Orders table migration failed but continuing: " + e.getMessage());
            // Continue anyway
        }
        
        // Create default admin user if it doesn't exist
        if (userRepository.findByUsername("admin").isEmpty()) {
            // Use native SQL to avoid getGeneratedKeys() issue with SQLite
            String encodedPassword = passwordEncoder.encode("admin123");
            String sql = "INSERT INTO users (username, email, password, name, role, created_at) " +
                        "VALUES (?, ?, ?, ?, ?, ?)";
            
            Query query = entityManager.createNativeQuery(sql);
            query.setParameter(1, "admin");
            query.setParameter(2, "admin@sudharshini.com");
            query.setParameter(3, encodedPassword);
            query.setParameter(4, "Admin User");
            query.setParameter(5, "ADMIN");
            query.setParameter(6, LocalDateTime.now());
            
            query.executeUpdate();
            
            System.out.println("Default admin user created: username=admin, password=admin123");
            System.out.println("⚠️  IMPORTANT: Change the default admin password after first login!");
        }

        seedProductsIfEmpty();
    }

    private void seedProductsIfEmpty() {
        try {
            if (productRepository.count() > 0) {
                System.out.println("ℹ️  Products already exist, skipping seed.");
                return;
            }

            LocalDate today = LocalDate.now();
            LocalDateTime now = LocalDateTime.now();
            
            // Use native SQL to avoid getGeneratedKeys() issue with SQLite
            String sql = "INSERT INTO products (name, description, category, price, stock_quantity, sku, expiry_date, image_url, created_at, updated_at) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            
            insertProduct(sql, "Premium Basmati Rice 10kg", "Aged long grain rice for daily meals", "Pantry", "1079", 140, "SKU-PRD-001", today.plusDays(16), "https://m.media-amazon.com/images/I/71ujqLlQhPL._AC_UL480_FMwebp_QL65_.jpg", now);
            insertProduct(sql, "Whole Wheat Atta 10kg", "Stone-ground flour for soft rotis", "Pantry", "1139", 120, "SKU-PRD-002", today.plusDays(145), "https://m.media-amazon.com/images/I/71xzRmVTtIL._AC_UL480_FMwebp_QL65_.jpg", now);
            insertProduct(sql, "Organic Brown Rice 5kg", "Fiber-rich brown rice", "Pantry", "799", 90, "SKU-PRD-003", today.plusDays(62), "https://m.media-amazon.com/images/I/61eCvWzUtnL._SX679_.jpg", now);
            insertProduct(sql, "Idli Dosa Batter 1kg", "Ready-to-cook fermented batter", "Dairy", "3.20", 80, "SKU-PRD-004", today.plusDays(64), "https://m.media-amazon.com/images/I/51wD4GL+yWL.jpg", now);
            insertProduct(sql, "Classic Ghee 1L", "Slow-cooked cow ghee", "Dairy", "1054.56", 60, "SKU-PRD-005", today.plusDays(240), "https://m.media-amazon.com/images/I/71gCf7cjpRL._AC_UL480_FMwebp_QL65_.jpg", now);
            insertProduct(sql, "Cow Milk 1L", "Toned fresh milk", "Dairy", "280", 200, "SKU-PRD-006", today.plusDays(10), "https://m.media-amazon.com/images/I/614nP7VOH9L._AC_UL480_FMwebp_QL65_.jpg", now);
            insertProduct(sql, "Greek Yogurt 500g", "High-protein strained yogurt", "Dairy", "208.80", 110, "SKU-PRD-007", today.plusDays(25), "https://m.media-amazon.com/images/I/613AStmWOKL._AC_UL480_FMwebp_QL65_.jpg", now);
            insertProduct(sql, "Paneer 200g", "Fresh cottage cheese cubes", "Dairy", "101.10", 95, "SKU-PRD-008", today.plusDays(14), "https://m.media-amazon.com/images/I/81hD14MN91L._SX679_.jpg", now);
            insertProduct(sql, "Cheddar Cheese 400g", "Mild cheddar block", "Dairy", "237", 70, "SKU-PRD-009", today.plusDays(90), "https://m.media-amazon.com/images/I/71gTSqOGbHL._AC_UL480_FMwebp_QL65_.jpg", now);
            insertProduct(sql, "Fresh Butter 500g", "Creamy table butter", "Dairy", "324", 75, "SKU-PRD-010", today.plusDays(60), "https://m.media-amazon.com/images/I/71+njocF0vL._AC_UL480_FMwebp_QL65_.jpg", now);
            insertProduct(sql, "Filter Coffee Powder 500g", "Blend for strong decoction", "Beverages", "723.80", 130, "SKU-PRD-011", today.plusDays(540), "https://m.media-amazon.com/images/I/71GyIj77EhL._AC_UL480_FMwebp_QL65_.jpg", now);
            insertProduct(sql, "Instant Coffee Jar 200g", "Freeze-dried coffee crystals", "Beverages", "271", 150, "SKU-PRD-012", today.plusDays(540), "https://m.media-amazon.com/images/I/61cMHd80RLL._AC_UL480_FMwebp_QL65_.jpg", now);
            insertProduct(sql, "Darjeeling Tea 250g", "Loose-leaf aromatic tea", "Beverages", "653", 160, "SKU-PRD-013", today.plusDays(540), "https://m.media-amazon.com/images/I/711uMR9YodL._AC_UL480_FMwebp_QL65_.jpg", now);
            insertProduct(sql, "Green Tea Bags 100s", "Light and refreshing green tea", "Beverages", "230", 140, "SKU-PRD-014", today.plusDays(540), "https://m.media-amazon.com/images/I/61gdOrCX8BL._AC_UL480_FMwebp_QL65_.jpg", now);
            insertProduct(sql, "Badam Milk Mix 500g", "Almond and saffron drink mix", "Beverages", "290", 90, "SKU-PRD-015", today.plusDays(300), "https://m.media-amazon.com/images/I/61qTUodGRdL._AC_UL480_FMwebp_QL65_.jpg", now);
            insertProduct(sql, "Cold Pressed Groundnut Oil 5L", "Unrefined cold-pressed oil", "Pantry", "1793", 85, "SKU-PRD-016", today.plusDays(365), "https://m.media-amazon.com/images/I/71hVCcKWC0L._AC_UL480_FMwebp_QL65_.jpg", now);
            insertProduct(sql, "Extra Virgin Olive Oil 1L", "First press olive oil", "Pantry", "973", 70, "SKU-PRD-017", today.plusDays(365), "https://m.media-amazon.com/images/I/613HYsESilL._SX679_.jpg", now);
            insertProduct(sql, "Sunflower Oil 1L", "Light cooking oil", "Pantry", "281", 100, "SKU-PRD-018", today.plusDays(365), "https://m.media-amazon.com/images/I/61ZlnJ-ckxL._AC_UL480_FMwebp_QL65_.jpg", now);
            insertProduct(sql, "Raw Almonds 500g", "Whole Californian almonds", "Snacks", "466", 95, "SKU-PRD-019", today.plusDays(270), "https://m.media-amazon.com/images/I/61JysAVWHKL._AC_UL480_FMwebp_QL65_.jpg", now);
            insertProduct(sql, "Whole Cashews 500g", "Crisp premium cashews", "Snacks", "999", 90, "SKU-PRD-020", today.plusDays(270), "https://m.media-amazon.com/images/I/61fu0uSIZcL._AC_UL480_FMwebp_QL65_.jpg", now);
            insertProduct(sql, "Pistachios Roasted 250g", "Lightly salted pistachios", "Snacks", "780", 80, "SKU-PRD-021", today.plusDays(240), "https://m.media-amazon.com/images/I/71C9Nf8Wu0L._AC_UL480_FMwebp_QL65_.jpg", now);
            insertProduct(sql, "Trail Mix 400g", "Nuts, seeds, and berries mix", "Snacks", "1299", 85, "SKU-PRD-022", today.plusDays(240), "https://m.media-amazon.com/images/I/718Jd+a2UAL._AC_UL480_FMwebp_QL65_.jpg", now);
            insertProduct(sql, "Roasted Chana 500g", "Protein-rich roasted chickpeas", "Snacks", "89", 120, "SKU-PRD-023", today.plusDays(240), "https://m.media-amazon.com/images/I/61BRYL-H7pL._AC_UL480_FMwebp_QL65_.jpg", now);
            insertProduct(sql, "Peanut Butter Crunchy 1kg", "High-protein spread", "Snacks", "185", 100, "SKU-PRD-024", today.plusDays(365), "https://m.media-amazon.com/images/I/51XpQuUsZHL._AC_UL480_FMwebp_QL65_.jpg", now);
            insertProduct(sql, "Dark Chocolate 70% 100g", "Single-origin cocoa bar", "Snacks", "389", 150, "SKU-PRD-025", today.plusDays(240), "https://m.media-amazon.com/images/I/71wVgnD8VqL._AC_UL480_FMwebp_QL65_.jpg", now);
            insertProduct(sql, "Milk Chocolate 100g", "Smooth milk chocolate bar", "Snacks", "248", 150, "SKU-PRD-026", today.plusDays(240), "https://m.media-amazon.com/images/I/71CCfcQIYoL._AC_UL480_FMwebp_QL65_.jpg", now);
            insertProduct(sql, "Protein Bar Choco Almond", "12g protein energy bar", "Snacks", "633", 180, "SKU-PRD-027", today.plusDays(180), "https://m.media-amazon.com/images/I/71dTJpftaoL._AC_UL480_FMwebp_QL65_.jpg", now);
            insertProduct(sql, "Granola Clusters 500g", "Crunchy oat clusters with nuts", "Snacks", "326", 110, "SKU-PRD-028", today.plusDays(150), "https://m.media-amazon.com/images/I/71VuYlyO8uL._AC_UL480_FMwebp_QL65_.jpg", now);
            insertProduct(sql, "Whole Grain Oats 1kg", "Rolled oats for breakfast", "Breakfast", "250", 140, "SKU-PRD-029", today.plusDays(365), "https://m.media-amazon.com/images/I/71Lj7hjwfqL._AC_UL480_FMwebp_QL65_.jpg", now);
            insertProduct(sql, "Wildflower Honey 500g", "Unprocessed raw honey", "Breakfast", "599", 120, "SKU-PRD-030", today.plusDays(540), "https://m.media-amazon.com/images/I/61GAdRoP2jL._AC_UL480_FMwebp_QL65_.jpg", now);
            insertProduct(sql, "Corn Flakes 875g", "Light toasted flakes", "Breakfast", "133", 150, "SKU-PRD-031", today.plusDays(365), "https://m.media-amazon.com/images/I/51On9DbnN1L._AC_UL480_FMwebp_QL65_.jpg", now);
            insertProduct(sql, "Muesli Fruit and Nut 750g", "No added sugar muesli", "Breakfast", "305", 125, "SKU-PRD-032", today.plusDays(365), "https://m.media-amazon.com/images/I/81jnU7BjO8L._AC_UL480_FMwebp_QL65_.jpg", now);
            insertProduct(sql, "Instant Noodles Masala 12 Pack", "Family pack ready noodles", "Pantry", "120", 190, "SKU-PRD-033", today.plusDays(365), "https://m.media-amazon.com/images/I/71R+kuYnovL._AC_UL480_FMwebp_QL65_.jpg", now);
            insertProduct(sql, "Penne Pasta 500g", "Durum wheat pasta", "Pantry", "80", 160, "SKU-PRD-034", today.plusDays(365), "https://m.media-amazon.com/images/I/61tq2gCU7QL._AC_UL480_FMwebp_QL65_.jpg", now);
            insertProduct(sql, "Spaghetti 400g", "Classic spaghetti strands", "Pantry", "77", 150, "SKU-PRD-035", today.plusDays(365), "https://m.media-amazon.com/images/I/510VO-Qrv3L._AC_UL480_FMwebp_QL65_.jpg", now);
            insertProduct(sql, "Tomato Basil Pasta Sauce 400g", "Slow-cooked Italian sauce", "Pantry", "320", 130, "SKU-PRD-036", today.plusDays(365), "https://m.media-amazon.com/images/I/71u-g1RFIrL._AC_UL480_FMwebp_QL65_.jpg", now);
            insertProduct(sql, "Pizza Pasta Sauce 350g", "Herb rich multi-use sauce", "Pantry", "180", 140, "SKU-PRD-037", today.plusDays(365), "https://m.media-amazon.com/images/I/71Ubig5lceL._AC_UL480_FMwebp_QL65_.jpg", now);
            insertProduct(sql, "Poha Flattened Rice 1kg", "Medium thick flakes", "Pantry", "240", 160, "SKU-PRD-038", today.plusDays(365), "https://m.media-amazon.com/images/I/71CkBTBuHtL._AC_UL480_FMwebp_QL65_.jpg", now);
            insertProduct(sql, "Kabuli Chana 4kg", "Premium chickpeas", "Pantry", "360", 150, "SKU-PRD-039", today.plusDays(365), "https://m.media-amazon.com/images/I/71HGrqrNf8L._AC_UL480_FMwebp_QL65_.jpg", now);
            insertProduct(sql, "Red Kidney Beans 1kg", "High-protein rajma", "Pantry", "180", 140, "SKU-PRD-040", today.plusDays(365), "https://m.media-amazon.com/images/I/71mWlLLVNtL._AC_UL480_FMwebp_QL65_.jpg", now);
            insertProduct(sql, "Toor Dal 1kg", "Unpolished arhar dal", "Pantry", "160", 200, "SKU-PRD-041", today.plusDays(365), "https://m.media-amazon.com/images/I/61HWmesEe-L._AC_UL480_FMwebp_QL65_.jpg", now);
            insertProduct(sql, "Moong Dal 1kg", "Split yellow moong", "Pantry", "140", 190, "SKU-PRD-042", today.plusDays(365), "https://m.media-amazon.com/images/I/71iJt-aYbZL._AC_UL480_FMwebp_QL65_.jpg", now);
            insertProduct(sql, "Urad Dal 500g", "Skinned urad dal", "Pantry", "120", 170, "SKU-PRD-043", today.plusDays(365), "https://m.media-amazon.com/images/I/71mrlsQubIL._AC_UL480_FMwebp_QL65_.jpg", now);
            insertProduct(sql, "Sambar Powder 200g", "Roasted spice blend", "Pantry", "130", 160, "SKU-PRD-044", today.plusDays(365), "https://m.media-amazon.com/images/I/61LMRVKQTjL._AC_UL480_FMwebp_QL65_.jpg", now);
            insertProduct(sql, "Garam Masala 100g", "Fragrant garam masala", "Pantry", "55", 170, "SKU-PRD-045", today.plusDays(365), "https://m.media-amazon.com/images/I/71F5t572b5L._AC_UL480_FMwebp_QL65_.jpg", now);
            insertProduct(sql, "Whole Black Pepper 200g", "Sun-dried peppercorns", "Pantry", "449", 120, "SKU-PRD-046", today.plusDays(365), "https://m.media-amazon.com/images/I/81jNQTmshrL._AC_UL480_FMwebp_QL65_.jpg", now);
            insertProduct(sql, "Cumin Seeds 200g", "Aromatic cumin seeds", "Pantry", "84", 150, "SKU-PRD-047", today.plusDays(365), "https://m.media-amazon.com/images/I/61A4NmjOVjL._AC_UL480_FMwebp_QL65_.jpg", now);
            insertProduct(sql, "Turmeric Powder 200g", "High-curcumin turmeric", "Pantry", "399", 160, "SKU-PRD-048", today.plusDays(365), "https://m.media-amazon.com/images/I/81PqVakmwPL._AC_UL480_FMwebp_QL65_.jpg", now);
            insertProduct(sql, "Himalayan Pink Salt 1kg", "Unrefined mineral-rich salt", "Pantry", "300", 180, "SKU-PRD-049", today.plusDays(720), "https://m.media-amazon.com/images/I/510-o9RtOVL._AC_UL480_FMwebp_QL65_.jpg", now);
            insertProduct(sql, "Rock Salt Powder 1kg", "Powdered sendha namak", "Pantry", "83", 180, "SKU-PRD-050", today.plusDays(720), "https://m.media-amazon.com/images/I/614kL5ApmPL._AC_UL480_FMwebp_QL65_.jpg", now);
            insertProduct(sql, "iPhone 15 Pro 128GB", "Advanced smartphone with A17 Pro chip", "Electronics", "91568.00", 80, "SKU-PRD-038", today.plusDays(365), "https://m.media-amazon.com/images/I/81SigpJN1KL._SL1500_.jpg", now);
            insertProduct(sql, "Samsung Galaxy S24 Ultra", "Flagship Android phone with S Pen", "Electronics", "118978.00", 70, "SKU-PRD-039", today.plusDays(365), "https://m.media-amazon.com/images/I/717Q2swzhBL._SL1500_.jpg", now);
            insertProduct(sql, "Google Pixel 8", "AI-powered camera phone", "Electronics", "64028.00", 90, "SKU-PRD-040", today.plusDays(365), "https://m.media-amazon.com/images/I/41suocIFDCL._SL1500_.jpg", now);
            insertProduct(sql, "Sony Xperia 1 V", "Cinema-grade display phone", "Electronics", "109828.00", 50, "SKU-PRD-042", today.plusDays(365), "https://m.media-amazon.com/images/I/31Hvn1HM4GL._SL1500_.jpg", now);
            insertProduct(sql, "Apple AirPods Pro 2", "Noise-cancelling wireless earbuds", "Electronics", "22808.00", 120, "SKU-PRD-043", today.plusDays(365), "https://m.media-amazon.com/images/I/61SUj2aKoEL._SL1500_.jpg", now);
            insertProduct(sql, "Bose QuietComfort Earbuds II", "Immersive sound earbuds", "Electronics", "25556.00", 85, "SKU-PRD-046", today.plusDays(365), "https://m.media-amazon.com/images/I/51mVon5oCYL._SL1500_.jpg", now);
            insertProduct(sql, "Jabra Elite 10", "Adaptive hybrid ANC earbuds", "Electronics", "20664.00", 95, "SKU-PRD-047", today.plusDays(365), "https://m.media-amazon.com/images/I/31TlSAO-+nL._SL1500_.jpg", now);
            insertProduct(sql, "MacBook Air M3 13-inch", "Ultra-thin laptop with Apple Silicon", "Electronics", "100748.00", 40, "SKU-PRD-048", today.plusDays(365), "https://m.media-amazon.com/images/I/71x9JI-Il0L._SL1500_.jpg", now);
            insertProduct(sql, "HP Spectre x360 14", "2-in-1 convertible laptop", "Electronics", "119068.00", 55, "SKU-PRD-050", today.plusDays(365), "https://m.media-amazon.com/images/I/71Kwi8zU+DL._SL1500_.jpg", now);
            insertProduct(sql, "Lenovo ThinkPad X1 Carbon Gen 12", "Business-grade ultralight laptop", "Electronics", "128204.00", 35, "SKU-PRD-051", today.plusDays(365), "https://m.media-amazon.com/images/I/41zpKENnq+L._SL1500_.jpg", now);
            insertProduct(sql, "Apple Watch Series 9 41mm", "Advanced health tracking smartwatch", "Electronics", "36576.00", 75, "SKU-PRD-053", today.plusDays(365), "https://m.media-amazon.com/images/I/41+xy3gGO6L._SL1500_.jpg", now);
            insertProduct(sql, "Samsung Galaxy Watch 6 Classic", "Elegant smartwatch with rotating bezel", "Electronics", "31988.00", 65, "SKU-PRD-054", today.plusDays(365), "https://m.media-amazon.com/images/I/41Q+MNft5ML._SL1500_.jpg", now);
            insertProduct(sql, "Garmin Venu 3", "GPS fitness smartwatch", "Electronics", "41148.00", 80, "SKU-PRD-055", today.plusDays(365), "https://m.media-amazon.com/images/I/41onrfk1GeL._SL1500_.jpg", now);
            insertProduct(sql, "Fitbit Versa 4", "Affordable health-focused smartwatch", "Electronics", "18244.00", 100, "SKU-PRD-056", today.plusDays(365), "https://m.media-amazon.com/images/I/31no9Y6TZdL._SL1500_.jpg", now);
            insertProduct(sql, "Google Pixel Watch 2", "Seamless Android integration watch", "Electronics", "31988.00", 70, "SKU-PRD-057", today.plusDays(365), "https://m.media-amazon.com/images/I/31S3WrHefPL._SL1500_.jpg", now);
            insertProduct(sql, "POCO C71, Cool Blue (6GB, 128GB)", "Budget smartphone with a large display and decent performance for everyday use.", "Electronics", "8180.00", 85, "SKU-PRD-058", today.plusDays(365), "https://m.media-amazon.com/images/I/51FgDipEA3L._SL1500_.jpg", now);
            insertProduct(sql, "Redmi A4 5G (Starry Black, 6GB RAM, 128GB Storage)", "Features the segment's largest 6.88-inch 120Hz display, 50MP dual camera, and 18W fast charging, with charger included in the box.", "Electronics", "9999.00", 92, "SKU-PRD-059", today.plusDays(365), "https://m.media-amazon.com/images/I/710SCukwhcL._SL1500_.jpg", now);
            insertProduct(sql, "Samsung Galaxy M07 Mobile (Black, 4GB RAM, 64GB Storage)", "Equipped with MediaTek Helio G99 processor, 50MP camera, IP54 rating, and 5000mAh battery with 25W fast charging; comes without charger.", "Electronics", "7499.00", 78, "SKU-PRD-060", today.plusDays(365), "https://m.media-amazon.com/images/I/610lbucItmL._SL1500_.jpg", now);
            insertProduct(sql, "iQOO Z10x 5G (Titanium, 8GB RAM, 256GB Storage)", "Offers a 6500mAh battery, Dimensity 7300 processor, and military-grade durability for extended use.", "Electronics", "17998.00", 65, "SKU-PRD-061", today.plusDays(365), "https://m.media-amazon.com/images/I/61YfJEGeqDL._SL1500_.jpg", now);
            insertProduct(sql, "realme NARZO 80 Lite 5G (Onyx Black, 6GB+128GB)", "Includes a 6000mAh battery, MediaTek Dimensity 6300 5G, AI assist, and IP64 water & dust resistance with military-grade durability.", "Electronics", "12499.00", 110, "SKU-PRD-062", today.plusDays(365), "https://m.media-amazon.com/images/I/71R6-3GIe2L._SL1500_.jpg", now);
            insertProduct(sql, "Samsung Galaxy A55 5G (Awesome Navy, 8GB RAM, 256GB Storage)", "AI-enabled phone with 50MP OIS camera, Super HDR video, nightography features, IP67 rating, and Gorilla Glass Victus+ protection.", "Electronics", "25998.00", 55, "SKU-PRD-063", today.plusDays(365), "https://m.media-amazon.com/images/I/71EeBkydf9L._SL1500_.jpg", now);
            insertProduct(sql, "POCO M7 5G Satin Black 8GB RAM|128GB ROM|SD4 Gen2 Processor|6.88\" HD+ Display|50MP Camera|8MP Front Camera|5160 mAh Battery", "Powered by SD4 Gen2 processor, features a 6.88-inch HD+ display, 50MP main camera, and 5160mAh battery for reliable performance.", "Electronics", "11990.00", 102, "SKU-PRD-064", today.plusDays(365), "https://m.media-amazon.com/images/I/71EfJ+H1uRL._SL1500_.jpg", now);
            insertProduct(sql, "Motorola G57 Power 5G (Fluidity, 8GB RAM, 128GB Storage)| Snapdragon 6s Gen 4 Processor | 6.72\" FHD+ Display | 50MP LYT-600 + 8MP Ultrawide | 8MP Selfie Camera | 7000mAh Battery, 33W TurboPower | IP64", "Includes Snapdragon 6s Gen 4 processor, 6.72-inch FHD+ display, 50MP + 8MP cameras, 7000mAh battery with 33W charging, and IP64 rating.", "Electronics", "13999.00", 88, "SKU-PRD-065", today.plusDays(365), "https://m.media-amazon.com/images/I/41cSpRScVlL._SL1500_.jpg", now);
            insertProduct(sql, "Samsung Galaxy M06 5G Mobile (Sage Green, 4GB RAM, 64GB Storage)", "Features MediaTek Dimensity 6300, AnTuTu 422K+ score, 12 5G bands, 25W fast charging, and 50MP camera; without charger.", "Electronics", "8999.00", 120, "SKU-PRD-066", today.plusDays(365), "https://m.media-amazon.com/images/I/71evPv-TvmL._SL1500_.jpg", now);
            insertProduct(sql, "Vivo Y19e (Majestic Green, 4GB RAM, 64GB Storage) with No Cost EMI/Additional Exchange Offers | with Charger", "Entry-level phone with 4GB RAM, 64GB storage, and includes a charger; supports no-cost EMI and exchange offers.", "Electronics", "8999.00", 95, "SKU-PRD-067", today.plusDays(365), "https://m.media-amazon.com/images/I/71tqCUlv-xL._SL1500_.jpg", now);
            insertProduct(sql, "Lava Bold N1 Lite (Crystal Gold, 3 GB RAM, 64 GB Storage)", "Budget device with 6.75-inch HD+ display, 13MP AI dual rear camera, 5000mAh battery, face unlock, and fingerprint reader; includes charger and cover.", "Electronics", "5999.00", 130, "SKU-PRD-068", today.plusDays(365), "https://m.media-amazon.com/images/I/71RwVkNGo4L._SL1500_.jpg", now);
            insertProduct(sql, "Samsung Galaxy A35 5G (Awesome Lilac, 8GB RAM, 128GB Storage)", "Premium model with glass back, 50MP OIS camera, nightography, IP67 rating, Gorilla Glass Victus+, and sAMOLED display with vision booster.", "Electronics", "19663.00", 72, "SKU-PRD-069", today.plusDays(365), "https://m.media-amazon.com/images/I/71w0ku3JQbL._SL1500_.jpg", now);
            insertProduct(sql, "VIVO T4x (Pronto Purple, 6GB + 128GB)", "Mid-range smartphone with 6GB RAM and 128GB storage for smooth multitasking and storage needs.", "Electronics", "15499.00", 81, "SKU-PRD-070", today.plusDays(365), "https://m.media-amazon.com/images/I/719ohKdmv8L._SL1500_.jpg", now);
            insertProduct(sql, "realme NARZO 90x 5G (Nitro Blue,6GB+128GB)", "Features 7000mAh battery with 60W charging, 144Hz display, Sony 50MP AI camera, AI assist, and 400% ultra boom speaker.", "Electronics", "13999.00", 104, "SKU-PRD-071", today.plusDays(365), "https://m.media-amazon.com/images/I/81iDmqegt4L._SL1500_.jpg", now);
            insertProduct(sql, "iQOO Z10 Lite 5G (Titanium Blue, 8GB RAM, 256GB Storage)", "Equipped with 6000mAh battery, Dimensity 6300 processor (433K+ AnTuTu), and military-grade shock resistance with IP64 rating.", "Electronics", "14999.00", 67, "SKU-PRD-072", today.plusDays(365), "https://m.media-amazon.com/images/I/61vww2LWl9L._SL1500_.jpg", now);
            insertProduct(sql, "Redmi 13 5G Prime Edition, Hawaiian Blue, 8GB+128GB", "India debut with SD 4 Gen 2 AE processor, 108MP pro-grade camera, and 6.79-inch largest display in segment.", "Electronics", "12999.00", 98, "SKU-PRD-073", today.plusDays(365), "https://m.media-amazon.com/images/I/81CQZB2t52L._SL1500_.jpg", now);
            insertProduct(sql, "Noise Buds N1 Truly Wireless Earbuds with Chrome Finish, 40H Playtime, Quad Mic with ENC, Ultra Low Latency Gaming (Up to 40ms), Instacharge (10 Min=120 Min), Bluetooth V5.3 (Carbon Black)", "40H playtime, Quad Mic + ENC, 40ms ultra-low latency gaming, Instacharge (10 min = 120 min), Bluetooth V5.3", "Electronics", "1199.00", 115, "SKU-PRD-074", today.plusDays(365), "https://m.media-amazon.com/images/I/61bcY1YYXoL._AC_SL1500_.jpg", now);
            insertProduct(sql, "Noise Buds N1 Truly Wireless Earbuds with Chrome Finish, 40H of Playtime, Quad Mic with ENC, Ultra Low Latency Gaming (Up to 40ms), Instacharge (10 Min=120 Min), Bluetooth V5.3 (Forest Green)", "Same as above, Forest Green color variant", "Electronics", "1199.00", 108, "SKU-PRD-075", today.plusDays(365), "https://m.media-amazon.com/images/I/61ds95t85yL._AC_SL1500_.jpg", now);
            insertProduct(sql, "Noise Buds N1 Truly Wireless Earbuds with Chrome Finish, 40H of Playtime, Quad Mic with ENC, Ultra Low Latency Gaming (Up to 40ms), Instacharge (10 Min=120 Min), Bluetooth V5.3 (Calm Beige)", "Same as above, Calm Beige color variant", "Electronics", "1199.00", 123, "SKU-PRD-076", today.plusDays(365), "https://m.media-amazon.com/images/I/51d+U2c57mL._AC_SL1500_.jpg", now);
            insertProduct(sql, "LIVIQUES UltraPods Max True Wireless Earbuds", "Bluetooth 5.3, enhanced sound, touch control, noise cancellation, long battery, comfortable fit", "Electronics", "299.00", 140, "SKU-PRD-077", today.plusDays(365), "https://m.media-amazon.com/images/I/51AaQmfb2AL._AC_SL1500_.jpg", now);
            insertProduct(sql, "HAMMER Ultra Pods True Wireless Earbuds (Beige)", "In-built mic, 100H standby, 50H playtime, 13mm drivers, BT v6.0, USB-C, IPX5", "Electronics", "599.00", 95, "SKU-PRD-078", today.plusDays(365), "https://m.media-amazon.com/images/I/51iBvJ8+cxL._AC_SL1500_.jpg", now);
            insertProduct(sql, "Philips TAT1269 Bluetooth Truly Wireless Earbuds (Deep Black)", "13mm drivers, BT 5.4, 40H playtime, IPX5, fast charge, touch control, voice assistant, mono mode, LED indicator", "Electronics", "913.00", 112, "SKU-PRD-079", today.plusDays(365), "https://m.media-amazon.com/images/I/61yj9oMhONL._AC_SL1500_.jpg", now);
            insertProduct(sql, "ACwO Dwots Bold Wireless in Ear Earbuds (Bold Black)", "1.83\" HD touch display, 32dB ANC, 4 ENC mics, find my earphone, 3D spatial sound, quick charge, 60H playtime", "Electronics", "2499.00", 76, "SKU-PRD-080", today.plusDays(365), "https://m.media-amazon.com/images/I/61gR08RGEdL._AC_SR322,134_CB1169409_QL70_.jpg", now);
            insertProduct(sql, "ACwO Dwots Bold Wireless in Ear Earbuds (Bold Grey)", "Same as above, Grey variant", "Electronics", "2498.00", 89, "SKU-PRD-081", today.plusDays(365), "https://m.media-amazon.com/images/I/61Welvy-9aL._AC_SR322,134_CB1169409_QL70_.jpg", now);
            insertProduct(sql, "ACwO Fire Prime TWS Earbuds (Creme, Beige)", "Smart HD display, 40dB ANC (in-ear), 80H playtime, 4 mics AI-ENC, 3D spatial sound, BT V5.4", "Electronics", "3498.00", 62, "SKU-PRD-082", today.plusDays(365), "https://m.media-amazon.com/images/I/51hbWiKv3RL._AC_SR322,134_CB1169409_QL70_.jpg", now);
            insertProduct(sql, "pTron Bassbuds Fury (Black)", "13mm drivers, 50H playtime, AI-ENC calls, BT V5.4, voice assistant, Type-C, IPX5", "Electronics", "569.00", 128, "SKU-PRD-083", today.plusDays(365), "https://m.media-amazon.com/images/I/6194kVLSt9L._AC_UL640_QL65_.jpg", now);
            insertProduct(sql, "OnePlus Nord Buds 3 (Harmonic Gray)", "Up to 32dB ANC, 10min = 11H fast charge, 43H total playback", "Electronics", "1899.00", 105, "SKU-PRD-084", today.plusDays(365), "https://m.media-amazon.com/images/I/519DDBTBbzL._AC_UY218_.jpg", now);
            insertProduct(sql, "Kratos Cube Ear Buds", "30H playtime, noise isolation, clear calls, voice assistant, BT V5.3, Type-C, IPX4", "Electronics", "499.00", 137, "SKU-PRD-085", today.plusDays(365), "https://m.media-amazon.com/images/I/71il16-75rL._AC_UY218_.jpg", now);
            insertProduct(sql, "amazon basics True Wireless in-Ear Earbuds (White)", "Mic, touch control, IPX5, BT 5.3, 36H playtime, voice assistant, fast charging", "Electronics", "553.00", 116, "SKU-PRD-086", today.plusDays(365), "https://m.media-amazon.com/images/I/51SZlUWNVOL._AC_UY218_.jpg", now);
            insertProduct(sql, "GOBOULT Z40 True Wireless Earbuds (Blue)", "60H playtime, Zen™ ENC mic, low latency gaming, Type-C, 10mm bass drivers, IPX5, Made in India", "Electronics", "999.00", 94, "SKU-PRD-087", today.plusDays(365), "https://m.media-amazon.com/images/I/71rlmEZ6cjL._AC_UY218_.jpg", now);
            insertProduct(sql, "boAt Airdopes 131/8 (Active Black)", "60H playback, ASAP Charge, Bluetooth, in-ear with mic", "Electronics", "749.00", 121, "SKU-PRD-088", today.plusDays(365), "https://m.media-amazon.com/images/I/71qedw-kh+L._AC_UY218_.jpg", now);
            insertProduct(sql, "realme Buds T310 (Vibrant Black)", "46dB Hybrid ANC, 360° Spatial Audio, 12.4mm bass driver, 40H battery, fast charging", "Electronics", "1899.00", 79, "SKU-PRD-089", today.plusDays(365), "https://m.media-amazon.com/images/I/61dj32WdrxL._AC_UY218_.jpg", now);
            insertProduct(sql, "soundcore by Anker R50i VI (Blue)", "10mm drivers, big bass, BT 5.3, 30H playtime, water-resistant, AI clear calls, 22 EQ presets", "Electronics", "899.00", 107, "SKU-PRD-090", today.plusDays(365), "https://m.media-amazon.com/images/I/612Z9cuWLpL._AC_UY218_.jpg", now);
            insertProduct(sql, "realme Buds T200x (Pure Black)", "12.4mm bass drivers, 25dB ANC, quad mic, 45ms latency, 48H playback, fast charge, IP55, BT 5.4", "Electronics", "1299.00", 113, "SKU-PRD-091", today.plusDays(365), "https://m.media-amazon.com/images/I/61Ow0V-mzkL._AC_UY218_.jpg", now);
            insertProduct(sql, "pTron Bassbuds Spark (Black)", "Stereo sound, 40H playtime, stereo calls, BT V5.3, quick pairing, touch control, Type-C, IPX5", "Electronics", "549.00", 132, "SKU-PRD-092", today.plusDays(365), "https://m.media-amazon.com/images/I/51SedBxOvfL._AC_UY218_.jpg", now);
            insertProduct(sql, "truke Buds Elite (Black)", "10mm dynamic driver, 70H battery, fast charging, dual-mic ENC, 40ms low latency, volume control, BT 5.4", "Electronics", "699.00", 99, "SKU-PRD-093", today.plusDays(365), "https://m.media-amazon.com/images/I/61IJb69H+wL._AC_UY218_.jpg", now);
            insertProduct(sql, "HITECH Hype TWS Earbuds (White)", "45H playtime, Type-C fast charging, HD stereo, touch controls, 12m range, lightweight", "Electronics", "299.00", 145, "SKU-PRD-094", today.plusDays(365), "https://m.media-amazon.com/images/I/51wycW23RPL._AC_UY218_.jpg", now);
            insertProduct(sql, "JBL Wave Buds 2 (Black)", "BT 5.3, ANC, multi-connect, app EQ (extra bass, relax mode), speed charge, 40H playback, fast pair, 4 mics, IP54", "Electronics", "2209.00", 84, "SKU-PRD-095", today.plusDays(365), "https://m.media-amazon.com/images/I/613Znd0DHhL._AC_UY218_.jpg", now);
            insertProduct(sql, "boAt Airdopes Joy (Jet Black)", "35H battery, fast charge, IWP tech, low latency, 2-mic ENx, Type-C, BT 5.3", "Electronics", "699.00", 118, "SKU-PRD-096", today.plusDays(365), "https://m.media-amazon.com/images/I/512jrg8-68L._AC_UY218_.jpg", now);
            insertProduct(sql, "Apple 2025 MacBook Air (13-inch, Apple M4 chip with 10-core CPU and 10-core GPU, 24GB Unified Memory, 512GB) - Sky Blue", "A premium laptop featuring the Apple M4 chip for high performance, designed for Apple Intelligence, with a 13-inch display and ample memory for multitasking.", "Electronics", "125990.00", 45, "SKU-PRD-097", today.plusDays(365), "https://m.media-amazon.com/images/I/71pKJ+Mjd8L._AC_SR160,134_CB1169409_QL70_.jpg", now);
            insertProduct(sql, "Apple 2025 MacBook Pro Laptop with M5 chip, 10‑core CPU and 10‑core GPU: Built for Apple Intelligence, 35.97 cm (14.2″) Liquid Retina XDR Display, 16GB Unified Memory, 512GB SSD Storage; Silver", "High-end MacBook Pro with M5 chip optimized for Apple Intelligence, featuring a 14.2-inch Liquid Retina XDR display and fast SSD storage for professional use.", "Electronics", "164490.00", 38, "SKU-PRD-098", today.plusDays(365), "https://m.media-amazon.com/images/I/61L3QBZ7Q+L._AC_SR160,134_CB1169409_QL70_.jpg", now);
            insertProduct(sql, "Apple 2024 MacBook Pro Laptop with M4 chip with 10‑core CPU and 10‑core GPU: Built for Apple Intelligence, (14.2″) Liquid Retina XDR Display, 14GB Unified Memory, 1TB SSD Storage; Space Black", "Advanced MacBook Pro equipped with M4 chip and Apple Intelligence, offering a 14.2-inch XDR display, 14GB memory, and 1TB storage in Space Black.", "Electronics", "195990.00", 32, "SKU-PRD-099", today.plusDays(365), "https://m.media-amazon.com/images/I/61eA9PkZ07L._AC_SR160,134_CB1169409_QL70_.jpg", now);
            insertProduct(sql, "HP 15 Laptop, AMD Ryzen 5 7520U (16GB DDR5,512GB SSD) Win11,M365 Basic(1yr)*Office Home24, Anti-Glare,15.6''/39.6cm,FHD,Backlit KB,FHD Camera w/Privacy Shutter,Radeon Graphics, Silver,1.59kg FC0690AU", "Affordable HP laptop with AMD Ryzen 5 processor, 16GB RAM, 512GB SSD, and anti-glare FHD display, including backlit keyboard and privacy shutter.", "Electronics", "44990.00", 68, "SKU-PRD-100", today.plusDays(365), "https://m.media-amazon.com/images/I/71-8y5gh4bL._AC_UY218_.jpg", now);
            insertProduct(sql, "HP Smartchoice Victus, AMD Ryzen 7 7445HS, 6GB RTX 3050, 16GB DDR5(Upgradeable) 512GB SSD, FHD, 144Hz, 300 nits, 15.6''/39.6cm, Win 11, M365* Office24, Blue, 2.29kg, fb3134AX/3120ax, Gaming Laptop", "Gaming laptop with AMD Ryzen 7, NVIDIA RTX 3050 graphics, 16GB DDR5 RAM, 512GB SSD, and 144Hz FHD display for smooth gameplay.", "Electronics", "65990.00", 52, "SKU-PRD-101", today.plusDays(365), "https://m.media-amazon.com/images/I/71o5eHSQiKL._AC_UY218_.jpg", now);
            insertProduct(sql, "HP Smartchoice Victus, 13th Gen Intel Core i7-13620H, 8GB RTX 5050, 24GB DDR5(Upgradeable) 1TB SSD, 144Hz, FHD, 15.6''/39.6cm, Win11, M365* Office24, Mica Silver, 2.29kg, fa2309TX, RGB Gaming Laptop", "Powerful gaming laptop featuring 13th Gen Intel i7, 8GB RTX 5050 GPU, 24GB DDR5 RAM, 1TB SSD, and 144Hz FHD display with RGB keyboard.", "Electronics", "99990.00", 41, "SKU-PRD-102", today.plusDays(365), "https://m.media-amazon.com/images/I/71HKFtogydL._AC_UY218_.jpg", now);
            insertProduct(sql, "Lenovo Smartchoice IdeaPad Slim 3 13th Gen Core i7-13620H 15.3\" (38.8cm) WUXGA IPS Laptop (16GB RAM/512GB SSD/Win 11/Office 2024/Backlit/Top Metal Cover & IR Camera/Grey/1.6Kg),83K100CJIN/S1IN", "Slim Lenovo IdeaPad with 13th Gen Intel i7, 16GB RAM, 512GB SSD, WUXGA IPS display, backlit keyboard, and IR camera for secure login.", "Electronics", "69090.00", 59, "SKU-PRD-103", today.plusDays(365), "https://m.media-amazon.com/images/I/71IjxF4prWL._AC_UY218_.jpg", now);
            insertProduct(sql, "HP 15, Intel Core Ultra 5 125H (16GB DDR5, 1TB SSD) FHD, IPS, 15.6''/39.6cm, Win11, M365 Basic(1yr)*Office24, Silver, 1.65kg, fd1354TU, Intel Arc Graphics, FHD Camera w/Shutter, AI Powered Laptop", "AI-powered HP laptop with Intel Core Ultra 5, 16GB DDR5, 1TB SSD, FHD IPS display, and Intel Arc graphics for enhanced visuals.", "Electronics", "63990.00", 74, "SKU-PRD-104", today.plusDays(365), "https://m.media-amazon.com/images/I/71dyfY6G0aL._AC_UY218_.jpg", now);
            insertProduct(sql, "HP 15, AMD Ryzen 3 7320U (8GB DDR4, 512GB SSD) FHD, Anti-Glare, Micro-Edge, 15.6''/39.6cm, Win11, M365 Basic(1yr)* Office24, Silver, 1.59kg, fc0500AU, FHD Camera w/Privacy Shutter Laptop", "Budget-friendly HP laptop with AMD Ryzen 3, 8GB DDR4 RAM, 512GB SSD, anti-glare FHD display, and privacy shutter on camera.", "Electronics", "44990.00", 96, "SKU-PRD-105", today.plusDays(365), "https://m.media-amazon.com/images/I/71JcEk00fqL._AC_UY218_.jpg", now);
            insertProduct(sql, "HP Anti-Glare Micro-Edge Office24-fc0500AU", "HP laptop with anti-glare micro-edge display, Office24, suitable for office use.", "Electronics", "33990.00", 111, "SKU-PRD-106", today.plusDays(365), "https://m.media-amazon.com/images/I/81nPkLHN3vL._AC_UY218_.jpg", now);
            insertProduct(sql, "ASUS TUF A15 (2025), AMD Ryzen 7 7445HS, Gaming Laptop(RTX 3050,75W TGP,16GB DDR5(Upgradeable Upto 64GB )512GB SSD,FHD,15.6\",144Hz,RGB Keyboard,48Whrs,Windows 11,Graphite Black,2.3 Kg) FA506NCG-HN199W", "Gaming laptop with AMD Ryzen 7 processor, RTX 3050 graphics, 16GB DDR5 RAM, 512GB SSD, 15.6\" FHD 144Hz display, RGB keyboard, Windows 11.", "Electronics", "66990.00", 47, "SKU-PRD-107", today.plusDays(365), "https://m.media-amazon.com/images/I/81nPkLHN3vL._AC_UY218_.jpg", now);
            insertProduct(sql, "HP 15, 13th Gen Intel Core i5-1334U, (16GB DDR4,512GB SSD) Anti-Glare, Micro-Edge, FHD, 15.6''/39.6cm, Win11, M365 Basic(1yr)* Office24, Silver, 1.59kg, fd0577TU, Iris Xe, FHD Camera w/Shutter Laptop", "HP laptop with 13th Gen Intel Core i5, 16GB DDR4 RAM, 512GB SSD, anti-glare micro-edge FHD display, Windows 11, M365 Basic, Office24.", "Electronics", "52490.00", 83, "SKU-PRD-108", today.plusDays(365), "https://m.media-amazon.com/images/I/71Z4mSII9BL._AC_UY218_.jpg", now);
            insertProduct(sql, "ASUS Vivobook Go 14, AMD Ryzen 3 7320U, 8GB RAM, 512GB SSD, FHD 14\", Windows 11, Office Home 2024, Mixed Black, 1.38 kg, E1404FA-NK3325WS, AMD Radeon iGPU, M365 Basic (1Year)*, Thin & Light Laptop", "Thin and light ASUS Vivobook with AMD Ryzen 3, 8GB RAM, 512GB SSD, 14\" FHD display, Windows 11, Office Home 2024, M365 Basic.", "Electronics", "31891.00", 106, "SKU-PRD-109", today.plusDays(365), "https://m.media-amazon.com/images/I/71Mh-ltniDL._AC_UY218_.jpg", now);
            insertProduct(sql, "Lenovo V15 G4 AMD Ryzen 5 7520U 15.6 inch FHD Laptop, AMD Graphics, 16GB DDR5 5500Mhz Ram, 512GB SSD NVMe, Windows 11, Dolby Audio, Arctic Grey, 1 Year Onsite Brand Warranty", "Lenovo laptop with AMD Ryzen 5, 16GB DDR5 RAM, 512GB SSD, 15.6\" FHD display, AMD graphics, Windows 11, Dolby Audio, 1 year onsite warranty.", "Electronics", "38999.00", 91, "SKU-PRD-110", today.plusDays(365), "https://m.media-amazon.com/images/I/71aup0IO2ZL._AC_UY218_.jpg", now);
            insertProduct(sql, "Lenovo {SmartChoice)Chromebook Intel Celeron N4500 (4GB RAM/64GB eMMC 5.1/11.6 Inch (29.46cm)/HD Display/2Wx2 Stereo Speakers/HD Camera/Chrome OS/Blue/1.21Kg), 82UY0014HA", "Lenovo Chromebook with Intel Celeron N4500, 4GB RAM, 64GB eMMC, 11.6\" HD display, stereo speakers, HD camera, Chrome OS.", "Electronics", "14990.00", 124, "SKU-PRD-111", today.plusDays(365), "https://m.media-amazon.com/images/I/61QY1NrWQBL._AC_UY218_.jpg", now);
            insertProduct(sql, "Acer Aspire Go 14,14th Gen, Intel Core Ultra 5 125H, 16GB DDR5, 512GB, WUXGA IPS, 14.0\"/35.56cm, Win 11, MS Office, Steel Gray, 1.5 kg, AG14-71M, Backlit KB, AI Powered Laptop", "Acer Aspire Go with 14th Gen Intel Core Ultra 5, 16GB DDR5, 512GB SSD, 14\" WUXGA IPS display, Windows 11, MS Office, backlit keyboard, AI powered.", "Electronics", "54499.00", 70, "SKU-PRD-112", today.plusDays(365), "https://m.media-amazon.com/images/I/71JI131B9SL._AC_UY218_.jpg", now);
            insertProduct(sql, "HP Victus, AMD Ryzen 7 7445HS, 4GB RTX 2050, 16GB DDR5(Upgradable) 512GB SSD, FHD, 144Hz, 300 nits, IPS, 15.6''/39.6cm, Win11, M365* Office24, Mica Silver, 2.29kg, fb3123AX, Backlit, Gaming Laptop", "HP Victus gaming laptop with AMD Ryzen 7, RTX 2050 graphics, 16GB DDR5 RAM, 512GB SSD, 15.6\" FHD 144Hz IPS display, backlit keyboard, Windows 11, M365 Office24.", "Electronics", "60990.00", 56, "SKU-PRD-113", today.plusDays(365), "https://m.media-amazon.com/images/I/71qIJPTTD3L._AC_UY218_.jpg", now);
            insertProduct(sql, "ASUS Vivobook 15, Smartchoice,Intel Core i5 13th Gen 13420H,16GB RAM, 512GB SSD, FHD 15.6\",Windows 11, Office Home 2024, Quiet Blue, 1.70 kg, X1502VA-BQ836WS,Intel UHD iGPU, M365 Basic (1Year)* Laptop", "ASUS Vivobook with 13th Gen Intel Core i5, 16GB RAM, 512GB SSD, 15.6\" FHD display, Windows 11, Office Home 2024, M365 Basic.", "Electronics", "52990.00", 77, "SKU-PRD-114", today.plusDays(365), "https://m.media-amazon.com/images/I/818iNyzckGL._AC_UY218_.jpg", now);
            insertProduct(sql, "Neopticon BrowseBook 14.1\" FHD IPS Laptop | Best Student & Office Work Laptop | Celeron N4020 | 4GB RAM | 128GB SSD | Windows 11 | 38Wh | 1.3kg | Grey", "Neopticon laptop for student and office use with Celeron N4020, 4GB RAM, 128GB SSD, 14.1\" FHD IPS display, Windows 11.", "Electronics", "12190.00", 133, "SKU-PRD-115", today.plusDays(365), "https://m.media-amazon.com/images/I/71h+7L8gcrL._AC_UY218_.jpg", now);
            insertProduct(sql, "HP Omnibook 5 OLED, Snapdragon X Processor (16GB LPDDR5x,1TB SSD) 2K OLED, Micro-Edge, 16''/40.6cm, Win11, M365*Office24, Glacier Silver, 1.59kg, fb0001QU, FHD Camera, Backlit, Next-Gen AI Laptop", "HP Omnibook with Snapdragon X processor, 16GB LPDDR5x RAM, 1TB SSD, 16\" 2K OLED display, Windows 11, M365 Office24, backlit, AI features.", "Electronics", "64313.00", 64, "SKU-PRD-116", today.plusDays(365), "https://m.media-amazon.com/images/I/71IdAMTOjZL._AC_UY218_.jpg", now);
            insertProduct(sql, "Fire-Boltt Ninja Call Pro Plus", "Bluetooth calling, AI voice assistant, 120+ sports modes, SpO2, heart rate monitor", "Electronics", "1099.00", 119, "SKU-PRD-117", today.plusDays(365), "https://m.media-amazon.com/images/I/61wpUnLObBL._SL1500_.jpg", now);
            insertProduct(sql, "Fastrack Limitless Glide X", "Bluetooth calling, SpO2, HR, sleep tracking, 100+ sports modes", "Electronics", "1299.00", 86, "SKU-PRD-118", today.plusDays(365), "https://m.media-amazon.com/images/I/71rNSvzQGlL._SL1500_.jpg", now);
            insertProduct(sql, "Noise Pulse 2 Max", "Bluetooth calling, smart DND, 100 sports modes", "Electronics", "1099.00", 127, "SKU-PRD-119", today.plusDays(365), "https://m.media-amazon.com/images/I/61bm7UEdGAL._SL1500_.jpg", now);
            insertProduct(sql, "Fire-Boltt Talk Round", "Bluetooth calling, voice assistant, 120+ sports modes", "Electronics", "1099.00", 93, "SKU-PRD-120", today.plusDays(365), "https://m.media-amazon.com/images/I/718aQSkSKmL._SL1500_.jpg", now);
            insertProduct(sql, "Fastrack Astor FR2 Pro", "Bluetooth calling, AI voice assistant, adaptive AOD, functional crown", "Electronics", "3499.00", 71, "SKU-PRD-121", today.plusDays(365), "https://m.media-amazon.com/images/I/71w-D3Ff-UL._SL1500_.jpg", now);
            insertProduct(sql, "Noise Twist Go", "Bluetooth calling, metal build, 100+ watch faces", "Electronics", "1699.00", 101, "SKU-PRD-122", today.plusDays(365), "https://m.media-amazon.com/images/I/61q0ZgCYoJL._SL1500_.jpg", now);
            insertProduct(sql, "Fire-Boltt Brillia", "Bluetooth calling, voice assistant, 120+ sports modes", "Electronics", "1999.00", 82, "SKU-PRD-123", today.plusDays(365), "https://m.media-amazon.com/images/I/61eYwoRZdGL._SL1500_.jpg", now);
            insertProduct(sql, "Noise Pro 5", "Bluetooth calling, DIY watch faces, smart dock, productivity suite", "Electronics", "2999.00", 97, "SKU-PRD-124", today.plusDays(365), "https://m.media-amazon.com/images/I/71HyyK04iFL._SL1500_.jpg", now);
            insertProduct(sql, "Fire-Boltt Ninja Call Pro Max", "Bluetooth calling, AI voice assistant, health suite", "Electronics", "1399.00", 109, "SKU-PRD-125", today.plusDays(365), "https://m.media-amazon.com/images/I/61sFBIcJAqL._SL1500_.jpg", now);
            insertProduct(sql, "Noise ColorFit Pulse 3", "Bluetooth calling, auto sport detection, 170+ watch faces", "Electronics", "1199.00", 134, "SKU-PRD-126", today.plusDays(365), "https://m.media-amazon.com/images/I/61DEUVd9PwL._SL1500_.jpg", now);
            insertProduct(sql, "Bouncefit D20 Y68", "Single touch interface, workout modes, quick charge", "Electronics", "399.00", 142, "SKU-PRD-127", today.plusDays(365), "https://m.media-amazon.com/images/I/51VZN8HIAFL._SL1500_.jpg", now);
            insertProduct(sql, "Amazfit Active 2", "Built-in GPS, 5ATM water resistant, 2000 NITS brightness", "Electronics", "9499.00", 50, "SKU-PRD-128", today.plusDays(365), "https://m.media-amazon.com/images/I/71mpuO4LqeL._SL1500_.jpg", now);
            insertProduct(sql, "Boat Wave Call 3", "Bluetooth calling, functional crown, animated watch faces", "Electronics", "1099.00", 117, "SKU-PRD-129", today.plusDays(365), "https://m.media-amazon.com/images/I/71Tq7xIA2xL._SL1500_.jpg", now);
            insertProduct(sql, "Fire-Boltt Phoenix Pro (Round)", "Bluetooth calling, AI voice assistant, 120+ sports modes", "Electronics", "1399.00", 88, "SKU-PRD-130", today.plusDays(365), "https://m.media-amazon.com/images/I/71tkAAxauUL._SL1500_.jpg", now);
            insertProduct(sql, "Noise Pro 6R", "Built-in GPS, Strava integration, AI Pro, TWS connectivity, emergency SOS", "Electronics", "6999.00", 61, "SKU-PRD-131", today.plusDays(365), "https://m.media-amazon.com/images/I/61HS0uDuadL._AC_SR322,134_CB1169409_QL70_.jpg", now);
            insertProduct(sql, "Pebble Hive Octa", "Bluetooth calling, rotating crown, in-built games", "Electronics", "1999.00", 100, "SKU-PRD-132", today.plusDays(365), "https://m.media-amazon.com/images/I/714eqwy+aGL._AC_UL640_QL65_.jpg", now);
            insertProduct(sql, "Noise Halo Plus", "Bluetooth calling, always-on display", "Electronics", "2799.00", 73, "SKU-PRD-133", today.plusDays(365), "https://m.media-amazon.com/images/I/71g09REHnkL._AC_UY218_.jpg", now);
            insertProduct(sql, "Boat Ultima Ember", "Personalized fitness nudges, functional crown", "Electronics", "1799.00", 114, "SKU-PRD-134", today.plusDays(365), "https://m.media-amazon.com/images/I/71St5sqS6CL._AC_UY218_.jpg", now);
            insertProduct(sql, "Fastrack Limitless FS2 Pro", "Bluetooth calling, AI voice assistant, fast charge", "Electronics", "2995.00", 80, "SKU-PRD-135", today.plusDays(365), "https://m.media-amazon.com/images/I/71oJxdvyJ7L._AC_UY218_.jpg", now);
            insertProduct(sql, "OnePlus Watch 2R", "Wear OS 4, Snapdragon W5, dual-frequency GPS", "Electronics", "11999.00", 66, "SKU-PRD-136", today.plusDays(365), "https://m.media-amazon.com/images/I/71-fLbOw9eL._AC_UY218_.jpg", now);
            insertProduct(sql, "WHOOP Peak (12-Month Membership)", "24/7 activity & sleep tracking, HRV, stress monitor, personalized coaching", "Electronics", "28990.00", 44, "SKU-PRD-137", today.plusDays(365), "https://m.media-amazon.com/images/I/61Fe+1-71-L._AC_UL640_QL65_.jpg", now);
            insertProduct(sql, "Samsung Galaxy Tab A11+, 27.82 cm (11 inch) Display, 6 GB RAM, 128 GB Storage, 90Hz Refresh Rate, AI with Google Gemini, Dolby Atmos, Quad Speakers, Wi-Fi Tablet, Silver", "This Wi-Fi tablet features an 11-inch display with a 90Hz refresh rate, 6GB RAM, 128GB storage, AI capabilities with Google Gemini, Dolby Atmos sound from quad speakers. It offers smooth performance for entertainment and productivity.", "Electronics", "18499.00", 90, "SKU-PRD-138", today.plusDays(365), "https://m.media-amazon.com/images/I/6191NEdjHdL._AC_UY218_.jpg", now);
            insertProduct(sql, "OnePlus Pad Go 28.85Cm 2.4K 7:5 Ratio Readfit Eye Care LCD Display, Dolby Atmos Quad Speakers, Wi-Fi Connectivity Tablet, 8GB RAM 128 GB Storage Expandable Up-to 1TB Asin, Twin Mint Colour", "This Wi-Fi tablet includes a 2.4K LCD display with eye care features, Dolby Atmos quad speakers, 8GB RAM, 128GB storage expandable up to 1TB, in Twin Mint color. It provides vibrant visuals and reliable connectivity for daily use.", "Electronics", "14999.00", 103, "SKU-PRD-139", today.plusDays(365), "https://m.media-amazon.com/images/I/51oj5gE7P+L._AC_UY218_.jpg", now);
            insertProduct(sql, "Lenovo Tab M11 | Wi-Fi+ 4G (LTE) Connectivity| 4 GB RAM, 128 GB ROM|11 Inch Screen| 90 Hz, 72% NTSC, FHD Display| Quad Speakers with Dolby Atmos|Octa-Core Processor |13 MP Rear Camera", "This tablet supports Wi-Fi and 4G LTE connectivity, with 4GB RAM, 128GB storage, an 11-inch FHD display at 90Hz, quad speakers with Dolby Atmos, octa-core processor, and a 13MP rear camera. It delivers clear visuals and fast performance.", "Electronics", "10694.00", 122, "SKU-PRD-140", today.plusDays(365), "https://m.media-amazon.com/images/I/7169kkVjYWL._AC_UY218_.jpg", now);
            insertProduct(sql, "OnePlus Pad Go 2, 30.73 cm (12.1 inch) 2.8K Display, Dolby Vision™, 120Hz Refresh Rate, Quad Speakers, AI, 10050 mAh Battery, Wi-Fi Tablet, 8GB RAM 128 GB Storage, Shadow Black", "This Wi-Fi tablet features a 12.1-inch 2.8K display with Dolby Vision and 120Hz refresh rate, quad speakers, AI enhancements, 10050mAh battery, 8GB RAM, and 128GB storage in Shadow Black. It ensures long-lasting use and immersive viewing.", "Electronics", "25999.00", 58, "SKU-PRD-141", today.plusDays(365), "https://m.media-amazon.com/images/I/61HTBi5HNQL._AC_UY218_.jpg", now);
            insertProduct(sql, "Samsung Galaxy Tab S10 FE, S Pen in-Box, 27.7 cm (10.9 inch) Display, AI Writing, Desktop Mode, Pre Loaded Pro Apps, 8 GB RAM, 128 GB Storage, Wi-Fi Tablet, Gray", "This Wi-Fi tablet includes an S Pen, 10.9-inch display, AI writing tools, desktop mode, pre-loaded pro apps, 8GB RAM, 128GB storage in Gray. It supports creative work and multitasking efficiently.", "Electronics", "37999.00", 69, "SKU-PRD-142", today.plusDays(365), "https://m.media-amazon.com/images/I/71oduBi6DHL._AC_UY218_.jpg", now);
            insertProduct(sql, "Samsung Galaxy Tab S11 with AI, Hexagonal S-Pen in-Box, 27.8 cm (11 Inch) Dynamic AMOLED 2X Display, 120Hz Refresh Rate, Pre Loaded Pro Apps, 12GB RAM, 128GB Storage, Wi-Fi Tablet, Gray", "This Wi-Fi tablet comes with a Hexagonal S-Pen, 11-inch Dynamic AMOLED 2X display at 120Hz, AI features, pre-loaded pro apps, 12GB RAM, 128GB storage in Gray. It offers premium display and performance for professionals.", "Electronics", "67900.00", 40, "SKU-PRD-143", today.plusDays(365), "https://m.media-amazon.com/images/I/51c25c+ccjL._AC_UY218_.jpg", now);
            insertProduct(sql, "XIAOMI Pad 7 Nano Texture Display [Smartchoice] | Snapdragon 7+ Gen 3| 3.2K Display (28.44 cm /11.2\") Tablet| 12GB, 256GB| Anti-Reflective| Anti-Glare| HyperOS 2| Dolby Vision Atmos | Graphite Grey", "This tablet features a nano texture 3.2K anti-reflective display, Snapdragon 7+ Gen 3 processor, 12GB RAM, 256GB storage, HyperOS 2, Dolby Vision Atmos in Graphite Grey. It provides glare-free viewing and powerful processing.", "Electronics", "29999.00", 87, "SKU-PRD-144", today.plusDays(365), "https://m.media-amazon.com/images/I/71yZPdov-SL._AC_UY218_.jpg", now);
            insertProduct(sql, "Samsung Galaxy Tab S11 Ultra with AI, Hexagonal S-Pen in-Box, 36.9 cm (14.6 Inch) Dynamic AMOLED 2X Display, 120Hz Refresh Rate, Pre Loaded Pro Apps, 12GB RAM, 256GB Storage, Wi-Fi Tablet, Gray", "This Wi-Fi tablet includes a Hexagonal S-Pen, 14.6-inch Dynamic AMOLED 2X display at 120Hz, AI capabilities, pre-loaded pro apps, 12GB RAM, 256GB storage in Gray. It is designed for expansive screen experience and advanced tasks.", "Electronics", "97662.00", 35, "SKU-PRD-145", today.plusDays(365), "https://m.media-amazon.com/images/I/51sWD2-949L._AC_UY218_.jpg", now);
            insertProduct(sql, "Redmi Pad 2 Wi-Fi + Cellular, Active Pen Support, 27.94cm(11\") Model, 2.5K Sharp & Clear Display, 8GB, 256GB, All Day & More 9000mAh Battery, AI-Enabled, Dolby Atmos, HyperOS 2, Graphite Grey", "This Wi-Fi and cellular tablet supports active pen, 11-inch 2.5K display, 8GB RAM, 256GB storage, 9000mAh battery, AI features, Dolby Atmos, HyperOS 2 in Graphite Grey. It offers extended battery life and smart functionalities.", "Electronics", "17999.00", 110, "SKU-PRD-146", today.plusDays(365), "https://m.media-amazon.com/images/I/71cXQm1s52L._AC_UY218_.jpg", now);
            insertProduct(sql, "Samsung Galaxy Tab S10 Lite with AI, S Pen in-Box, 27.7 cm (10.9 Inch) Display, Object Eraser, 90Hz Refresh Rate, Pre Loaded Pro Apps, IP42 Rating, 6GB RAM, 128GB Storage, Wi-Fi Tablet, Gray", "This Wi-Fi tablet includes an S Pen, 10.9-inch display with 90Hz refresh, AI object eraser, pre-loaded pro apps, IP42 rating, 6GB RAM, 128GB storage in Gray. It combines durability with editing tools.", "Electronics", "29999.00", 92, "SKU-PRD-147", today.plusDays(365), "https://m.media-amazon.com/images/I/71v4SZ7IzdL._AC_UY218_.jpg", now);
            insertProduct(sql, "Lenovo Tab | 10.1\" Display | Wi-Fi Only | 4 GB RAM + 64 GB ROM (Expandable up to 1 TB) | Metal Body | Dual Speakers with Dolby Atmos | Android 14 | Color: Luna Grey", "This Wi-Fi only tablet has a 10.1-inch display, 4GB RAM, 64GB storage expandable to 1TB, metal body, dual Dolby Atmos speakers, Android 14 in Luna Grey. It provides durable build and audio quality.", "Electronics", "9999.00", 126, "SKU-PRD-148", today.plusDays(365), "https://m.media-amazon.com/images/I/71rjCPr462L._AC_UY218_.jpg", now);
            insertProduct(sql, "Samsung Galaxy Tab S9 FE+ 31.50 cm (12.4 inch) Display, RAM 12 GB, ROM 256 GB Expandable, S Pen in-Box, Wi-Fi, IP68 Tablet, Gray", "This Wi-Fi tablet features a 12.4-inch display, 12GB RAM, 256GB expandable storage, S Pen, IP68 rating in Gray. It ensures water and dust resistance for rugged use.", "Electronics", "43860.00", 54, "SKU-PRD-149", today.plusDays(365), "https://m.media-amazon.com/images/I/61l5a94VKkL._AC_UY218_.jpg", now);
            insertProduct(sql, "Redmi Pad SE 4G | WiFi Mediatek Helio G55| 8.7-Inc Display | 6650Mah Battery | 90Hz Smooth Refresh Rate| 4GB, 128GB | 1340 X 800 Display | 1 Billion Colours | Dolby Atmos | Dual Speakers | Urban Grey", "This 4G tablet with Wi-Fi has an 8.7-inch display, Mediatek Helio G55 processor, 6650mAh battery, 90Hz refresh, 4GB RAM, 128GB storage, Dolby Atmos dual speakers in Urban Grey. It supports vibrant colors and smooth scrolling.", "Electronics", "9710.00", 115, "SKU-PRD-150", today.plusDays(365), "https://m.media-amazon.com/images/I/71J8aQRh8LL._AC_UY218_.jpg", now);
            insertProduct(sql, "Lenovo Tab M10 HD LED Tablet (10.1-inch, 2GB, 16GB, Cellular, WiFi Calling + WiFi, SLATE Black)", "This cellular tablet with Wi-Fi calling features a 10.1-inch HD LED display, 2GB RAM, 16GB storage in Slate Black. It allows voice calls over Wi-Fi or cellular networks.", "Electronics", "7250.00", 131, "SKU-PRD-151", today.plusDays(365), "https://m.media-amazon.com/images/I/61VlmrTM6wL._AC_UY218_.jpg", now);
            insertProduct(sql, "Samsung Galaxy Tab S10 FE+, S Pen in-Box, 27.7 cm (13.1 inch) Display, AI Writing, Desktop Mode, Pre Loaded Pro Apps, 8 GB RAM, 128 GB Storage, Wi-Fi Tablet, Gray", "This Wi-Fi tablet includes an S Pen, 13.1-inch display, AI writing, desktop mode, pre-loaded pro apps, 8GB RAM, 128GB storage in Gray. It facilitates productivity with larger screen real estate.", "Electronics", "46199.00", 63, "SKU-PRD-152", today.plusDays(365), "https://m.media-amazon.com/images/I/719Dv4Gy2kL._AC_UY218_.jpg", now);
            insertProduct(sql, "Lenovo Tab Plus with Octa JBL Hi-Fi Speakers| 8 GB RAM, 128 GB ROM| 11.5 Inch, 2K, 90 Hz Refresh| Wi-Fi Tablet| Android 14| 45 W Fast Charger| Built-in Kickstand| Color: Luna Grey", "This Wi-Fi tablet has octa JBL Hi-Fi speakers, 8GB RAM, 128GB storage, 11.5-inch 2K display at 90Hz, Android 14, 45W fast charger, built-in kickstand in Luna Grey. It enhances audio and portability.", "Electronics", "15999.00", 98, "SKU-PRD-153", today.plusDays(365), "https://m.media-amazon.com/images/I/61ZEkMXevXL._AC_UY218_.jpg", now);
            System.out.println("✅  Seeded 170 products for initial catalog.");
                } catch (Exception e) {
                    System.err.println("❌ Error seeding products: " + e.getMessage());
                    e.printStackTrace();
                }
            }
    
    private void insertProduct(String sql, String name, String description, String category, String price, int stockQuantity, String sku, LocalDate expiryDate, String imageUrl, LocalDateTime now) {
        Query query = entityManager.createNativeQuery(sql);
        query.setParameter(1, name);
        query.setParameter(2, description);
        query.setParameter(3, category);
        query.setParameter(4, new BigDecimal(price));
        query.setParameter(5, stockQuantity);
        query.setParameter(6, sku);
        query.setParameter(7, expiryDate);
        query.setParameter(8, imageUrl != null ? imageUrl : defaultImageUrl(name));
        query.setParameter(9, now);
        query.setParameter(10, now);
        query.executeUpdate();
    }

    private Product createProduct(String name, String description, String category, String price, int stockQuantity, String sku, LocalDate expiryDate, String imageUrl) {
        Product product = new Product();
        product.setName(name);
        product.setDescription(description);
        product.setCategory(category);
        product.setPrice(new BigDecimal(price));
        product.setStockQuantity(stockQuantity);
        product.setSku(sku);
        product.setExpiryDate(expiryDate);
        product.setImageUrl(imageUrl != null ? imageUrl : defaultImageUrl(name));
        return product;
    }

    private String defaultImageUrl(String name) {
        try {
            String encoded = URLEncoder.encode(name, StandardCharsets.UTF_8);
            return "https://via.placeholder.com/300?text=" + encoded;
        } catch (Exception e) {
            return "https://via.placeholder.com/300?text=Product";
        }
    }
    
    private void migrateDatabaseSchema() {
        try {
            System.out.println("🔍 Checking database schema for DELIVERY_MAN role support...");
            
            // Check if the users table exists and has the old constraint
            Query checkQuery = entityManager.createNativeQuery(
                "SELECT sql FROM sqlite_master WHERE type='table' AND name='users'"
            );
            
            @SuppressWarnings("unchecked")
            java.util.List<Object> results = checkQuery.getResultList();
            
            if (results.isEmpty()) {
                System.out.println("ℹ️  Users table doesn't exist yet. It will be created by Hibernate with the correct schema.");
                return;
            }
            
            String tableSql = (String) results.get(0);
            if (tableSql == null) {
                System.out.println("⚠️  Could not retrieve table schema");
                return;
            }
            
            // Print full schema for debugging
            System.out.println("📋 Full table schema:");
            System.out.println(tableSql);
            
            // Convert to uppercase for case-insensitive matching
            String upperTableSql = tableSql.toUpperCase();
            
            // Check if there's a CHECK constraint on the role column
            boolean hasCheckConstraint = upperTableSql.contains("CHECK") && upperTableSql.contains("ROLE");
            boolean needsMigration = false;
            
            if (hasCheckConstraint) {
                System.out.println("🔍 CHECK constraint found on role column");
                
                // Check if DELIVERY_MAN is mentioned in the constraint
                boolean hasDeliveryMan = upperTableSql.contains("'DELIVERY_MAN'") || upperTableSql.contains("\"DELIVERY_MAN\"");
                
                if (!hasDeliveryMan) {
                    // If there's a CHECK constraint but DELIVERY_MAN is not included, we need to migrate
                    needsMigration = true;
                    System.out.println("⚠️  CHECK constraint found but DELIVERY_MAN is not included - migration needed");
                    
                    // Try to extract the constraint pattern for logging
                    if (upperTableSql.contains("ROLE IN ('CUSTOMER','ADMIN')") || 
                        upperTableSql.contains("ROLE IN('CUSTOMER','ADMIN')")) {
                        System.out.println("   Detected pattern: role IN ('CUSTOMER','ADMIN')");
                    }
                } else {
                    System.out.println("✅ CHECK constraint includes DELIVERY_MAN - no migration needed");
                }
            } else {
                System.out.println("✅ No CHECK constraint found on role column - all roles are supported");
            }
            
            // If there's a CHECK constraint but it doesn't include DELIVERY_MAN, we need to migrate
            if (needsMigration) {
                System.out.println("🔄 Migrating database schema to support DELIVERY_MAN role...");
                
                // Get count of existing users for verification
                Query countQuery = entityManager.createNativeQuery("SELECT COUNT(*) FROM users");
                Long userCount = ((Number) countQuery.getSingleResult()).longValue();
                System.out.println("📊 Found " + userCount + " existing users to migrate");
                
                // Create backup table with all data
                entityManager.createNativeQuery(
                    "CREATE TABLE users_backup AS SELECT * FROM users"
                ).executeUpdate();
                System.out.println("💾 Backup table created");
                
                // Drop old table
                entityManager.createNativeQuery("DROP TABLE users").executeUpdate();
                System.out.println("🗑️  Old table dropped");
                
                // Recreate table WITHOUT CHECK constraint - we validate at application level
                // This avoids constraint issues and is more flexible
                String createTableSql = 
                    "CREATE TABLE users (" +
                    "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                    "email TEXT UNIQUE NOT NULL, " +
                    "name TEXT, " +
                    "mobile TEXT, " +
                    "role TEXT NOT NULL, " +
                    "username TEXT, " +
                    "password TEXT, " +
                    "google_id TEXT, " +
                    "created_at TIMESTAMP" +
                    ")";
                
                entityManager.createNativeQuery(createTableSql).executeUpdate();
                System.out.println("✨ New table created with DELIVERY_MAN support");
                
                // Restore all data from backup - explicitly specify column names to avoid column order issues
                entityManager.createNativeQuery(
                    "INSERT INTO users (id, email, name, mobile, role, username, password, google_id, created_at) " +
                    "SELECT id, email, name, mobile, role, username, password, google_id, created_at FROM users_backup"
                ).executeUpdate();
                
                // Verify data was restored
                Query verifyQuery = entityManager.createNativeQuery("SELECT COUNT(*) FROM users");
                Long restoredCount = ((Number) verifyQuery.getSingleResult()).longValue();
                System.out.println("✅ Restored " + restoredCount + " users");
                
                if (!userCount.equals(restoredCount)) {
                    throw new RuntimeException("Data loss detected! Expected " + userCount + " users but found " + restoredCount);
                }
                
                // Drop backup table
                entityManager.createNativeQuery("DROP TABLE users_backup").executeUpdate();
                System.out.println("🗑️  Backup table removed");
                
                System.out.println("✅ Database schema migrated successfully! CHECK constraint removed - DELIVERY_MAN role is now supported.");
            } else if (hasCheckConstraint && tableSql.contains("DELIVERY_MAN")) {
                System.out.println("✅ Database schema is up to date. DELIVERY_MAN role is supported.");
            } else if (!hasCheckConstraint) {
                System.out.println("✅ Database schema is up to date. No CHECK constraint found - all roles are supported.");
            } else {
                System.out.println("✅ Database schema check completed.");
            }
        } catch (Exception e) {
            System.err.println("❌ Error during database migration: " + e.getMessage());
            e.printStackTrace();
            System.err.println("⚠️  Application will continue, but DELIVERY_MAN role creation may fail.");
            System.err.println("   Please check the database schema manually or restart the application.");
            // Don't throw - allow application to continue
            // The migration will be retried on next startup if needed
        }
    }
    
    private void migrateOrdersTableSchema() {
        try {
            System.out.println("🔍 Checking orders table schema for ACCEPTED and PICKED_UP status support...");
            
            // Check if the orders table exists
            Query checkQuery = entityManager.createNativeQuery(
                "SELECT sql FROM sqlite_master WHERE type='table' AND name='orders'"
            );
            
            @SuppressWarnings("unchecked")
            java.util.List<Object> results = checkQuery.getResultList();
            
            if (results.isEmpty()) {
                System.out.println("ℹ️  Orders table doesn't exist yet. It will be created by Hibernate with the correct schema.");
                return;
            }
            
            String tableSql = (String) results.get(0);
            if (tableSql == null) {
                System.out.println("⚠️  Could not retrieve orders table schema");
                return;
            }
            
            // Print full schema for debugging
            System.out.println("📋 Orders table schema:");
            System.out.println(tableSql);
            
            // Convert to uppercase for case-insensitive matching
            String upperTableSql = tableSql.toUpperCase();
            
            // Check if there's a CHECK constraint on the status column that doesn't include ACCEPTED and PICKED_UP
            boolean hasCheckConstraint = upperTableSql.contains("CHECK") && upperTableSql.contains("STATUS");
            boolean includesAccepted = upperTableSql.contains("'ACCEPTED'") || upperTableSql.contains("\"ACCEPTED\"");
            boolean includesPickedUp = upperTableSql.contains("'PICKED_UP'") || upperTableSql.contains("\"PICKED_UP\"");
            
            boolean needsMigration = false;
            
            if (hasCheckConstraint && (!includesAccepted || !includesPickedUp)) {
                needsMigration = true;
                System.out.println("⚠️  CHECK constraint found but ACCEPTED or PICKED_UP is missing - migration needed");
            } else if (!hasCheckConstraint) {
                System.out.println("✅ No explicit CHECK constraint found on status column - all statuses are supported.");
            } else {
                System.out.println("✅ Database schema is up to date. CHECK constraint found and ACCEPTED/PICKED_UP statuses are supported.");
            }
            
            if (needsMigration) {
                System.out.println("🔄 Migrating orders table schema to support ACCEPTED and PICKED_UP statuses...");
                
                // Get count of existing orders for verification
                Query countQuery = entityManager.createNativeQuery("SELECT COUNT(*) FROM orders");
                Long orderCount = ((Number) countQuery.getSingleResult()).longValue();
                System.out.println("📊 Found " + orderCount + " existing orders to migrate");
                
                if (orderCount > 0) {
                    // Create backup table with all data
                    entityManager.createNativeQuery(
                        "CREATE TABLE orders_backup AS SELECT * FROM orders"
                    ).executeUpdate();
                    System.out.println("💾 Backup table created");
                }
                
                // Drop old table - Hibernate will recreate it without the CHECK constraint
                entityManager.createNativeQuery("DROP TABLE orders").executeUpdate();
                System.out.println("🗑️  Old table dropped");
                
                // Clear entity manager to force Hibernate to recreate the table
                entityManager.clear();
                
                System.out.println("✨ Table will be recreated by Hibernate on next operation without CHECK constraint");
                if (orderCount > 0) {
                    System.out.println("⚠️  Note: Existing orders data is backed up in orders_backup table");
                    System.out.println("   The table will be recreated and data can be restored if needed");
                }
                
                System.out.println("✅ Orders table schema migration initiated. Restart the application to complete the migration.");
            } else {
                System.out.println("✅ Orders table schema is up to date. No migration needed for ACCEPTED/PICKED_UP statuses.");
            }
        } catch (Exception e) {
            System.err.println("❌ Error during orders table migration: " + e.getMessage());
            e.printStackTrace();
            // Don't throw - allow app to continue
        }
    }
}

