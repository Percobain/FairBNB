// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title RentalNFT
 * @author FairBNB Team
 * @notice ERC721 token representing rental agreements on FairBNB platform
 * @dev Minimal on-chain storage - all metadata stored on BNB Greenfield
 */
contract RentalNFT is ERC721, ERC721URIStorage, ERC721Burnable, AccessControl, ReentrancyGuard {
    // Role definitions
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant LANDLORD_ROLE = keccak256("LANDLORD_ROLE");
    
    // Token ID counter
    uint256 private _tokenIdCounter;
    
    // Minimal on-chain data - only essential references
    mapping(uint256 => address) public tokenLandlord;
    
    // Escrow contract address (can transfer NFTs)
    address public escrowContract;
    
    // Events
    event PropertyMinted(
        uint256 indexed tokenId,
        address indexed landlord,
        string tokenURI
    );
    
    event TokenURIUpdated(
        uint256 indexed tokenId,
        string oldURI,
        string newURI,
        address indexed updatedBy
    );
    
    event EscrowContractUpdated(
        address indexed oldEscrow,
        address indexed newEscrow
    );

    /**
     * @dev Constructor
     * @param _name Token name
     * @param _symbol Token symbol
     */
    constructor(
        string memory _name,
        string memory _symbol
    ) ERC721(_name, _symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        
        // Start token IDs from 1
        _tokenIdCounter = 1;
    }

    /**
     * @notice Mint a new rental property NFT
     * @dev All property data stored on BNB Greenfield, only URI stored on-chain
     * @param to Address to mint the NFT to (usually the landlord)
     * @param _tokenURI URI pointing to complete metadata on BNB Greenfield
     * @return tokenId The ID of the newly minted token
     */
    function mint(
        address to,
        string memory _tokenURI
    ) external nonReentrant returns (uint256) {
        require(
            hasRole(MINTER_ROLE, msg.sender) || hasRole(LANDLORD_ROLE, msg.sender),
            "RentalNFT: Must have minter or landlord role"
        );
        require(to != address(0), "RentalNFT: Cannot mint to zero address");
        require(bytes(_tokenURI).length > 0, "RentalNFT: Token URI cannot be empty");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, _tokenURI);
        
        // Store only essential on-chain reference
        tokenLandlord[tokenId] = to;
        
        emit PropertyMinted(tokenId, to, _tokenURI);
        
        return tokenId;
    }

    /**
     * @notice Update the token URI for a property
     * @dev Only the landlord or admin can update
     * @param tokenId Token ID to update
     * @param newURI New URI pointing to updated metadata on Greenfield
     */
    function setTokenURI(uint256 tokenId, string memory newURI) external nonReentrant {
        require(_ownerOf(tokenId) != address(0), "RentalNFT: Token does not exist");
        require(
            tokenLandlord[tokenId] == msg.sender || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "RentalNFT: Only landlord or admin can update URI"
        );
        require(bytes(newURI).length > 0, "RentalNFT: New URI cannot be empty");
        
        string memory oldURI = tokenURI(tokenId);
        _setTokenURI(tokenId, newURI);
        
        emit TokenURIUpdated(tokenId, oldURI, newURI, msg.sender);
    }

    /**
     * @notice Set the escrow contract address
     * @dev Only admin can set escrow contract
     * @param _escrowContract Address of the escrow contract
     */
    function setEscrowContract(address _escrowContract) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_escrowContract != address(0), "RentalNFT: Invalid escrow address");
        address oldEscrow = escrowContract;
        escrowContract = _escrowContract;
        emit EscrowContractUpdated(oldEscrow, _escrowContract);
    }

    /**
     * @notice Grant landlord role to an address
     * @param account Address to grant landlord role
     */
    function grantLandlordRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(LANDLORD_ROLE, account);
    }

    /**
     * @notice Check if token exists
     * @param tokenId Token ID to check
     */
    function exists(uint256 tokenId) external view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    /**
     * @notice Get the current token ID counter value
     * @return Current counter value (next token ID to be minted)
     */
    function getCurrentTokenId() external view returns (uint256) {
        return _tokenIdCounter;
    }

    /**
     * @notice Get the original landlord of a token
     * @param tokenId Token ID to query
     * @return Address of the original landlord
     */
    function getLandlord(uint256 tokenId) external view returns (address) {
        require(_ownerOf(tokenId) != address(0), "RentalNFT: Token does not exist");
        return tokenLandlord[tokenId];
    }

    /**
     * @dev Override isApprovedForAll to auto-approve escrow contract
     */
    function isApprovedForAll(address owner, address operator) 
        public 
        view 
        override(ERC721, IERC721) 
        returns (bool) 
    {
        // Auto-approve escrow contract
        if (operator == escrowContract && escrowContract != address(0)) {
            return true;
        }
        return super.isApprovedForAll(owner, operator);
    }

    /**
     * @notice Burn a rental NFT and clean up associated data
     * @param tokenId Token ID to burn
     */
    function burn(uint256 tokenId) public override {
        // Clean up minimal on-chain data
        delete tokenLandlord[tokenId];
        super.burn(tokenId);
    }

    // Required overrides for multiple inheritance
    function tokenURI(uint256 tokenId) 
        public 
        view 
        override(ERC721, ERC721URIStorage) 
        returns (string memory) 
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

/**
 * BNB Greenfield Metadata Structure (stored off-chain):
 * {
 *   "name": "FairBNB Rental - Property #123",
 *   "description": "Rental agreement NFT for 2BHK in Mumbai",
 *   "image": "greenfield://fairbnb/images/property123/cover.jpg",
 *   "external_url": "https://fairbnb.xyz/property/123",
 *   "attributes": [
 *     {"trait_type": "city", "value": "Mumbai"},
 *     {"trait_type": "address", "value": "123 Marine Drive"},
 *     {"trait_type": "rent_bnb", "value": "0.002"},
 *     {"trait_type": "deposit_bnb", "value": "0.004"},
 *     {"trait_type": "dispute_fee_bnb", "value": "0.001"},
 *     {"trait_type": "duration_months", "value": "12"},
 *     {"trait_type": "latitude", "value": "19.059"},
 *     {"trait_type": "longitude", "value": "72.829"},
 *     {"trait_type": "bedrooms", "value": "2"},
 *     {"trait_type": "bathrooms", "value": "2"},
 *     {"trait_type": "area_sqft", "value": "1200"},
 *     {"trait_type": "furnished", "value": "true"},
 *     {"trait_type": "created_at", "value": "1234567890"}
 *   ],
 *   "media": [
 *     "greenfield://fairbnb/images/property123/img1.jpg",
 *     "greenfield://fairbnb/images/property123/img2.jpg",
 *     "greenfield://fairbnb/images/property123/img3.jpg"
 *   ],
 *   "documents": [
 *     "greenfield://fairbnb/docs/property123/terms.pdf",
 *     "greenfield://fairbnb/docs/property123/rules.pdf"
 *   ],
 *   "house_rules": "No smoking, No pets, Quiet hours 10pm-7am",
 *   "amenities": ["WiFi", "AC", "Parking", "Gym", "Pool"],
 *   "verification": {
 *     "verified": true,
 *     "verification_date": "2024-01-15",
 *     "verifier": "0x..."
 *   }
 * }
 */