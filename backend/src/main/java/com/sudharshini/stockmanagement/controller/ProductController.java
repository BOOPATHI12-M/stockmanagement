package com.sudharshini.stockmanagement.controller;

import com.sudharshini.stockmanagement.entity.Product;
import com.sudharshini.stockmanagement.repository.ProductRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Product Controller
 * Handles product CRUD operations
 */
@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "*")
public class ProductController {
    
    @Autowired
    private ProductRepository productRepository;
    
    @PersistenceContext
    private EntityManager entityManager;
    
    @Value("${file.upload.dir:uploads/products}")
    private String uploadDir;
    
    private Path getUploadPath() {
        Path path = Paths.get(uploadDir);
        try {
            if (!Files.exists(path)) {
                Files.createDirectories(path);
            }
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directory", e);
        }
        return path;
    }
    
    @GetMapping
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Product> getProduct(@PathVariable Long id) {
        Optional<Product> product = productRepository.findById(id);
        return product.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    @Transactional
    public ResponseEntity<?> createProduct(@RequestBody Map<String, Object> productData) {
        try {
            // Validate required fields
            if (productData.get("name") == null || productData.get("name").toString().isEmpty()) {
                return ResponseEntity.status(400).body(Map.of("error", "Product name is required"));
            }
            if (productData.get("price") == null) {
                return ResponseEntity.status(400).body(Map.of("error", "Price is required"));
            }
            if (productData.get("stockQuantity") == null) {
                return ResponseEntity.status(400).body(Map.of("error", "Stock quantity is required"));
            }
            
            // Use native SQL to avoid getGeneratedKeys() issue with SQLite
            String name = productData.get("name").toString();
            BigDecimal price = new BigDecimal(productData.get("price").toString());
            Integer stockQuantity = Integer.parseInt(productData.get("stockQuantity").toString());
            String description = productData.get("description") != null ? productData.get("description").toString() : null;
            String imageUrl = productData.get("imageUrl") != null ? productData.get("imageUrl").toString() : null;
            String category = productData.get("category") != null ? productData.get("category").toString() : null;
            String sku = productData.get("sku") != null ? productData.get("sku").toString() : null;
            LocalDate expiryDate = null;
            if (productData.get("expiryDate") != null && !productData.get("expiryDate").toString().isEmpty()) {
                expiryDate = LocalDate.parse(productData.get("expiryDate").toString());
            }
            
            String sql = "INSERT INTO products (name, description, price, stock_quantity, image_url, category, sku, expiry_date, created_at, updated_at) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            
            Query query = entityManager.createNativeQuery(sql);
            query.setParameter(1, name);
            query.setParameter(2, description);
            query.setParameter(3, price);
            query.setParameter(4, stockQuantity);
            query.setParameter(5, imageUrl);
            query.setParameter(6, category);
            query.setParameter(7, sku);
            query.setParameter(8, expiryDate);
            LocalDateTime now = LocalDateTime.now();
            query.setParameter(9, now);
            query.setParameter(10, now);
            
            query.executeUpdate();
            
            // Use SQLite's last_insert_rowid() to get the ID of the newly inserted row
            Query idQuery = entityManager.createNativeQuery("SELECT last_insert_rowid()");
            Long newId = ((Number) idQuery.getSingleResult()).longValue();
            
            // Fetch the newly created product by ID
            Optional<Product> createdProduct = productRepository.findById(newId);
            
            if (createdProduct.isPresent()) {
                return ResponseEntity.ok(createdProduct.get());
            } else {
                // Fallback: reload all products and find by name and created_at
                entityManager.flush();
                entityManager.clear();
                Optional<Product> foundProduct = productRepository.findAll().stream()
                    .filter(p -> p.getName().equals(name) && 
                            p.getCreatedAt() != null && 
                            p.getCreatedAt().isAfter(now.minusSeconds(2)))
                    .findFirst();
                
                if (foundProduct.isPresent()) {
                    return ResponseEntity.ok(foundProduct.get());
                } else {
                    throw new RuntimeException("Failed to retrieve created product");
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to create product: " + e.getMessage()));
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable Long id, @RequestBody Product productDetails) {
        Optional<Product> productOpt = productRepository.findById(id);
        if (productOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        Product product = productOpt.get();
        product.setName(productDetails.getName());
        product.setDescription(productDetails.getDescription());
        product.setPrice(productDetails.getPrice());
        product.setStockQuantity(productDetails.getStockQuantity());
        product.setImageUrl(productDetails.getImageUrl());
        product.setCategory(productDetails.getCategory());
        product.setSku(productDetails.getSku());
        product.setExpiryDate(productDetails.getExpiryDate());
        product.setSupplier(productDetails.getSupplier());
        
        return ResponseEntity.ok(productRepository.save(product));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable Long id) {
        if (productRepository.existsById(id)) {
            productRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
    
    /**
     * Upload product image
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.status(400).body(Map.of("error", "File is empty"));
            }
            
            // Validate file type
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.status(400).body(Map.of("error", "File must be an image"));
            }
            
            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String filename = UUID.randomUUID().toString() + extension;
            
            // Save file
            Path uploadPath = getUploadPath();
            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            
            // Return the URL path
            String imageUrl = "/api/products/images/" + filename;
            return ResponseEntity.ok(Map.of("imageUrl", imageUrl, "filename", filename));
            
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to upload file: " + e.getMessage()));
        }
    }
    
    /**
     * Serve uploaded images
     */
    @GetMapping("/images/{filename:.+}")
    public ResponseEntity<Resource> getImage(@PathVariable String filename) {
        try {
            Path filePath = getUploadPath().resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            
            if (resource.exists() && resource.isReadable()) {
                String contentType = null;
                try {
                    contentType = Files.probeContentType(filePath);
                } catch (IOException e) {
                    // Use default content type
                }
                if (contentType == null) {
                    contentType = "application/octet-stream";
                }
                
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}

