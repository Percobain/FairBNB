// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract FairBNB is ERC721, ERC721URIStorage {
    uint256 private _nextTokenId = 1;
    
    // Jury address - can be changed
    address public jury = 0x0729a81A995Bed60F4F6C5Ec960bEd999740e160;
    
    struct Rental {
        address landlord;
        address tenant;
        uint256 rent;
        uint256 deposit;
        uint256 disputeFee;
        bool tenantHappy;
        bool landlordHappy;
        bool isActive;
        bool isDisputed;
    }
    
    struct PropertyListing {
        uint256 rent;
        uint256 deposit;
        uint256 disputeFee;
        bool isListed;
    }
    
    // Mappings
    mapping(uint256 => Rental) public rentals;
    mapping(uint256 => PropertyListing) public listings;
    mapping(address => uint256) public pendingWithdrawals;
    mapping(address => uint256[]) private _userTokens;
    mapping(uint256 => uint256) private _tokenIndex; // tokenId => index in _userTokens array
    
    // Events for UI tracking
    event PropertyMinted(uint256 tokenId, address landlord, string uri);
    event PropertyListed(uint256 tokenId, uint256 rent, uint256 deposit, uint256 disputeFee);
    event PropertyRented(uint256 tokenId, address tenant, uint256 totalPaid);
    event HappyConfirmed(uint256 tokenId, address party, bool isLandlord);
    event RentalCompleted(uint256 tokenId, uint256 amountToLandlord);
    event DisputeRaised(uint256 tokenId);
    event DisputeResolved(uint256 tokenId, bool tenantWins, uint256 juryReward);
    event JuryChanged(address oldJury, address newJury);
    
    constructor() ERC721("FairBNB Property", "FBNB") {}
    
    // 1. Mint Property NFT with IPFS URI - Anyone can mint (UI will show as landlord-only)
    function mintProperty(string memory ipfsUri) public returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, ipfsUri); // Store IPFS URI (e.g., "ipfs://QmXxx...")
        
        // Don't manually track here, let _update handle it
        
        emit PropertyMinted(tokenId, msg.sender, ipfsUri);
        return tokenId;
    }
    
    // 2. List Property for Rent
    function listProperty(
        uint256 tokenId,
        uint256 rent,
        uint256 deposit,
        uint256 disputeFee
    ) public {
        // No checks - anyone can list any property
        listings[tokenId] = PropertyListing({
            rent: rent,
            deposit: deposit,
            disputeFee: disputeFee,
            isListed: true
        });
        
        emit PropertyListed(tokenId, rent, deposit, disputeFee);
    }
    
    // 3. Rent Property - Tenant deposits rent + safety deposit + dispute fee
    function rentProperty(uint256 tokenId) public payable {
        PropertyListing memory listing = listings[tokenId];
        
        // Store whatever is sent, no reverts
        if (msg.value > 0) {
            // Get current owner as landlord
            address propertyOwner = _ownerOf(tokenId);
            
            rentals[tokenId] = Rental({
                landlord: propertyOwner,
                tenant: msg.sender,
                rent: listing.rent,
                deposit: listing.deposit,
                disputeFee: listing.disputeFee,
                tenantHappy: false,
                landlordHappy: false,
                isActive: true,
                isDisputed: false
            });
            
            emit PropertyRented(tokenId, msg.sender, msg.value);
        }
    }
    
    // 4. Happy Path - Either party confirms satisfaction
    function confirmHappy(uint256 tokenId, bool isLandlord) public {
        Rental storage rental = rentals[tokenId];
        
        if (isLandlord) {
            rental.landlordHappy = true;
        } else {
            rental.tenantHappy = true;
        }
        
        emit HappyConfirmed(tokenId, msg.sender, isLandlord);
        
        // If either party is happy, release funds to landlord
        if ((rental.tenantHappy || rental.landlordHappy) && rental.isActive) {
            uint256 totalToLandlord = rental.rent + rental.deposit;
            rental.isActive = false;
            
            // Transfer to landlord
            pendingWithdrawals[rental.landlord] += totalToLandlord;
            // Return dispute fee to tenant
            pendingWithdrawals[rental.tenant] += rental.disputeFee;
            
            emit RentalCompleted(tokenId, totalToLandlord);
        }
    }
    
    // 5. Raise Dispute - Anyone can raise
    function raiseDispute(uint256 tokenId) public {
        rentals[tokenId].isDisputed = true;
        emit DisputeRaised(tokenId);
    }
    
    // 6. Resolve Dispute - Anyone can call (UI will restrict to jury)
    function resolveDispute(uint256 tokenId, bool tenantWins) public {
        Rental storage rental = rentals[tokenId];
        
        // Anyone can call, but we'll check jury in a soft way
        uint256 juryReward = rental.disputeFee / 2;
        
        if (tenantWins) {
            // Tenant wins: refund everything except half dispute fee
            uint256 tenantRefund = rental.rent + rental.deposit + (rental.disputeFee / 2);
            pendingWithdrawals[rental.tenant] += tenantRefund;
            pendingWithdrawals[jury] += juryReward;
        } else {
            // Landlord wins: gets rent + deposit
            pendingWithdrawals[rental.landlord] += rental.rent + rental.deposit;
            pendingWithdrawals[jury] += juryReward;
            // Remaining dispute fee stays in contract
        }
        
        rental.isActive = false;
        rental.isDisputed = false;
        
        emit DisputeResolved(tokenId, tenantWins, juryReward);
    }
    
    // 7. Change jury address - Anyone can call (UI will restrict)
    function changeJury(address newJury) public {
        address oldJury = jury;
        jury = newJury;
        emit JuryChanged(oldJury, newJury);
    }
    
    // 8. Withdraw accumulated funds
    function withdraw() public {
        uint256 amount = pendingWithdrawals[msg.sender];
        if (amount > 0) {
            pendingWithdrawals[msg.sender] = 0;
            payable(msg.sender).transfer(amount);
        }
    }
    
    // 9. Get all properties (for explore page)
    function getAllProperties() public view returns (uint256[] memory) {
        uint256 totalSupply = _nextTokenId - 1;
        uint256[] memory properties = new uint256[](totalSupply);
        
        for (uint256 i = 0; i < totalSupply; i++) {
            properties[i] = i + 1;
        }
        
        return properties;
    }
    
    // 10. Get user's NFTs
    function getUserTokens(address user) public view returns (uint256[] memory) {
        return _userTokens[user];
    }
    
    // 11. Get user's NFT count
    function getUserTokenCount(address user) public view returns (uint256) {
        return _userTokens[user].length;
    }
    
    // 12. Get rental details
    function getRentalDetails(uint256 tokenId) public view returns (
        address landlord,
        address tenant,
        uint256 rent,
        uint256 deposit,
        uint256 disputeFee,
        bool isActive,
        bool tenantHappy,
        bool landlordHappy,
        bool isDisputed
    ) {
        Rental memory rental = rentals[tokenId];
        return (
            rental.landlord,
            rental.tenant,
            rental.rent,
            rental.deposit,
            rental.disputeFee,
            rental.isActive,
            rental.tenantHappy,
            rental.landlordHappy,
            rental.isDisputed
        );
    }
    
    // 13. Get property listing details
    function getListingDetails(uint256 tokenId) public view returns (
        uint256 rent,
        uint256 deposit,
        uint256 disputeFee,
        bool isListed
    ) {
        PropertyListing memory listing = listings[tokenId];
        return (
            listing.rent,
            listing.deposit,
            listing.disputeFee,
            listing.isListed
        );
    }
    
    // 14. Get total supply of tokens
    function totalSupply() public view returns (uint256) {
        return _nextTokenId - 1;
    }
    
    // 15. Get all NFTs with details (for "All Listings" page)
    function getAllNFTsWithDetails() public view returns (
        uint256[] memory tokenIds,
        address[] memory owners,
        string[] memory uris,
        bool[] memory isListed,
        uint256[] memory rents,
        uint256[] memory deposits,
        bool[] memory isRented
    ) {
        uint256 total = totalSupply();
        
        tokenIds = new uint256[](total);
        owners = new address[](total);
        uris = new string[](total);
        isListed = new bool[](total);
        rents = new uint256[](total);
        deposits = new uint256[](total);
        isRented = new bool[](total);
        
        for (uint256 i = 0; i < total; i++) {
            uint256 tokenId = i + 1;
            tokenIds[i] = tokenId;
            
            // Check if token exists and get owner
            try this.ownerOf(tokenId) returns (address owner) {
                owners[i] = owner;
                uris[i] = tokenURI(tokenId);
                
                PropertyListing memory listing = listings[tokenId];
                isListed[i] = listing.isListed;
                rents[i] = listing.rent;
                deposits[i] = listing.deposit;
                
                Rental memory rental = rentals[tokenId];
                isRented[i] = rental.isActive;
            } catch {
                // Token doesn't exist or was burned
                owners[i] = address(0);
            }
        }
        
        return (tokenIds, owners, uris, isListed, rents, deposits, isRented);
    }
    
    // 16. Get all listed properties (only those available for rent)
    function getAvailableListings() public view returns (
        uint256[] memory availableTokenIds,
        address[] memory landlords,
        uint256[] memory rents,
        uint256[] memory deposits,
        uint256[] memory disputeFees
    ) {
        uint256 total = totalSupply();
        uint256 count = 0;
        
        // First, count available listings
        for (uint256 i = 1; i <= total; i++) {
            if (listings[i].isListed && !rentals[i].isActive) {
                count++;
            }
        }
        
        // Initialize arrays with correct size
        availableTokenIds = new uint256[](count);
        landlords = new address[](count);
        rents = new uint256[](count);
        deposits = new uint256[](count);
        disputeFees = new uint256[](count);
        
        // Populate arrays
        uint256 index = 0;
        for (uint256 i = 1; i <= total; i++) {
            if (listings[i].isListed && !rentals[i].isActive) {
                availableTokenIds[index] = i;
                
                try this.ownerOf(i) returns (address owner) {
                    landlords[index] = owner;
                } catch {
                    landlords[index] = address(0);
                }
                
                PropertyListing memory listing = listings[i];
                rents[index] = listing.rent;
                deposits[index] = listing.deposit;
                disputeFees[index] = listing.disputeFee;
                
                index++;
            }
        }
        
        return (availableTokenIds, landlords, rents, deposits, disputeFees);
    }
    
    // Override transfer to update user token tracking
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Update user token arrays when transferring
        if (from != address(0) && from != to) {
            // Remove from previous owner
            uint256 lastTokenIndex = _userTokens[from].length - 1;
            uint256 tokenIndexToRemove = _tokenIndex[tokenId];
            
            if (tokenIndexToRemove != lastTokenIndex) {
                uint256 lastTokenId = _userTokens[from][lastTokenIndex];
                _userTokens[from][tokenIndexToRemove] = lastTokenId;
                _tokenIndex[lastTokenId] = tokenIndexToRemove;
            }
            
            _userTokens[from].pop();
            delete _tokenIndex[tokenId];
        }
        
        // Add to new owner (including minting case where from == address(0))
        if (to != address(0)) {
            _userTokens[to].push(tokenId);
            _tokenIndex[tokenId] = _userTokens[to].length - 1;
        }
        
        return super._update(to, tokenId, auth);
    }
    
    // Required overrides for ERC721URIStorage
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
    
    // Fallback to accept BNB
    receive() external payable {}
    fallback() external payable {}
}