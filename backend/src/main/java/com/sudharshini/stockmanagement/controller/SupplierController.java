package com.sudharshini.stockmanagement.controller;

import com.sudharshini.stockmanagement.entity.Supplier;
import com.sudharshini.stockmanagement.repository.SupplierRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

/**
 * Supplier Controller
 * Handles supplier CRUD operations
 */
@RestController
@RequestMapping("/api/suppliers")
@CrossOrigin(origins = "*")
public class SupplierController {
    
    @Autowired
    private SupplierRepository supplierRepository;
    
    @GetMapping
    public List<Supplier> getAllSuppliers() {
        return supplierRepository.findAll();
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Supplier> getSupplier(@PathVariable Long id) {
        Optional<Supplier> supplier = supplierRepository.findById(id);
        return supplier.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public Supplier createSupplier(@RequestBody Supplier supplier) {
        return supplierRepository.save(supplier);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Supplier> updateSupplier(@PathVariable Long id, @RequestBody Supplier supplierDetails) {
        Optional<Supplier> supplierOpt = supplierRepository.findById(id);
        if (supplierOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        Supplier supplier = supplierOpt.get();
        supplier.setName(supplierDetails.getName());
        supplier.setEmail(supplierDetails.getEmail());
        supplier.setPhone(supplierDetails.getPhone());
        supplier.setAddress(supplierDetails.getAddress());
        supplier.setContactPerson(supplierDetails.getContactPerson());
        
        return ResponseEntity.ok(supplierRepository.save(supplier));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSupplier(@PathVariable Long id) {
        if (supplierRepository.existsById(id)) {
            supplierRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}

