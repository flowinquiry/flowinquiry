package io.flexwork.modules.crm.service;

import static io.flexwork.query.QueryUtils.createSpecification;

import io.flexwork.modules.crm.domain.Contact;
import io.flexwork.modules.crm.repository.ContactRepository;
import io.flexwork.modules.crm.service.dto.ContactDTO;
import io.flexwork.modules.crm.service.mapper.ContactMapper;
import io.flexwork.query.QueryDTO;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ContactService {

    private ContactRepository contactRepository;

    private ContactMapper contactMapper;

    public ContactService(ContactRepository contactRepository, ContactMapper contactMapper) {
        this.contactRepository = contactRepository;
        this.contactMapper = contactMapper;
    }

    public Page<Contact> findByAccountId(Long accountId, Pageable pageable) {
        return contactRepository.findByAccountId(accountId, pageable);
    }

    public Optional<Contact> getContactById(Long id) {
        return contactRepository.findById(id);
    }

    public Contact createContact(Contact contact) {
        return contactRepository.save(contact);
    }

    public Contact updateContact(Long id, Contact contactDetails) {
        Contact contact =
                contactRepository
                        .findById(id)
                        .orElseThrow(() -> new RuntimeException("Contact not found with id " + id));

        contact.setFirstName(contactDetails.getFirstName());
        contact.setLastName(contactDetails.getLastName());
        contact.setEmail(contactDetails.getEmail());
        contact.setPhone(contactDetails.getPhone());
        contact.setPosition(contactDetails.getPosition());
        contact.setNotes(contactDetails.getNotes());

        return contactRepository.save(contact);
    }

    public void deleteContact(Long id) {
        contactRepository.deleteById(id);
    }

    @Transactional
    public void deleteContacts(List<Long> ids) {
        contactRepository.deleteAllByIdInBatch(ids);
    }

    @Transactional(readOnly = true)
    public Page<ContactDTO> findContacts(Optional<QueryDTO> queryDTO, Pageable pageable) {
        Specification<Contact> spec = createSpecification(queryDTO);
        return contactRepository.findAll(spec, pageable).map(contactMapper::contactToContactDTO);
    }

    public Optional<ContactDTO> getNextEntity(Long currentId) {
        return contactRepository.findNextEntity(currentId).map(contactMapper::contactToContactDTO);
    }

    public Optional<ContactDTO> getPreviousEntity(Long currentId) {
        return contactRepository
                .findPreviousEntity(currentId)
                .map(contactMapper::contactToContactDTO);
    }
}
